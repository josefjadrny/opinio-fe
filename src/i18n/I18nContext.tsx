import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
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

  // Adopt the server's saved language for registered users ONCE, the first time
  // `me` loads. We must NOT keep re-adopting it on every later refetch: after
  // the user picks a language we PATCH the server, but the `me` cache can still
  // briefly hold the old value (the write isn't awaited / query not invalidated).
  // Re-running on each refetch let that stale value clobber the user's fresh
  // choice — the "language stops sticking" bug. A ref makes it strictly one-shot.
  const didAdoptServerLang = useRef(false);
  useEffect(() => {
    if (didAdoptServerLang.current) return;
    const serverLang = me?.user?.language;
    const tier = me?.user?.tier;
    if (tier === undefined) return; // me not loaded yet
    didAdoptServerLang.current = true;
    if (serverLang && tier !== 'anonymous' && serverLang in LANGUAGES && serverLang !== locale) {
      setLocaleState(serverLang as Locale);
      localStorage.setItem(LOCALE_KEY, serverLang);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.user?.language, me?.user?.tier]);

  // Keep <html lang> in sync with the active locale so the rendered page
  // reports its real language to crawlers (Googlebot renders JS) and assistive
  // tech — index.html ships a static lang="en" that's wrong once the UI
  // switches language. Purely a crawler/a11y signal, invisible to users.
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

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
