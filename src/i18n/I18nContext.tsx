import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { LANGUAGES, getDefaultLocale, type Locale, type Strings } from './strings';
import { updateMe } from '../api/client';
import { useQuery } from '@tanstack/react-query';
import { getMe } from '../api/client';

interface I18nContextValue {
  locale: Locale;
  t: Strings;
  setLocale: (locale: Locale) => void;
}

const LOCALE_KEY = 'opinio_locale';

function loadLocale(): Locale {
  try {
    const stored = localStorage.getItem(LOCALE_KEY);
    if (stored && stored in LANGUAGES) return stored as Locale;
  } catch { /* ignore */ }
  return getDefaultLocale();
}

const I18nContext = createContext<I18nContextValue>(null!);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(loadLocale);

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: getMe });

  // Sync language from server for registered users (overrides localStorage)
  useEffect(() => {
    const serverLang = me?.user?.language;
    const tier = me?.user?.tier;
    if (serverLang && tier !== 'anonymous' && serverLang in LANGUAGES && serverLang !== locale) {
      setLocaleState(serverLang as Locale);
      localStorage.setItem(LOCALE_KEY, serverLang);
    }
  // Only run when server data first loads — not on every locale change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.user?.language, me?.user?.tier]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(LOCALE_KEY, newLocale);
    // Persist to server for registered/supporter users
    if (me?.user?.tier && me.user.tier !== 'anonymous') {
      updateMe({ language: newLocale }).catch(() => { /* best-effort */ });
    }
  }, [me?.user?.tier]);

  const t = LANGUAGES[locale].strings;

  return (
    <I18nContext.Provider value={{ locale, t, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useI18n() {
  return useContext(I18nContext);
}
