import type { Locale } from '../i18n/strings';

const LOCALE_TO_BCP47: Record<Locale, string> = {
  en: 'en-US',
  cs: 'cs-CZ',
  es: 'es-ES',
};

export function formatRelativeTime(iso: string, locale: Locale, justNow: string): string {
  const diffSec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diffSec < 60) return justNow;

  const rtf = new Intl.RelativeTimeFormat(LOCALE_TO_BCP47[locale] ?? 'en-US', { numeric: 'always' });
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return rtf.format(-diffMin, 'minute');
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return rtf.format(-diffHr, 'hour');
  return rtf.format(-Math.floor(diffHr / 24), 'day');
}
