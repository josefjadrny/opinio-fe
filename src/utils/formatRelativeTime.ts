import type { Locale } from '../i18n/strings';

const LOCALE_TO_BCP47: Record<Locale, string> = {
  en: 'en-US',
  cs: 'cs-CZ',
  es: 'es-ES',
  de: 'de-DE',
  fr: 'fr-FR',
  it: 'it-IT',
  pl: 'pl-PL',
};

// One formatter per locale. Building an Intl formatter is costly and every
// feed card calls these on every render.
const formatters = new Map<string, Intl.RelativeTimeFormat>();
function rtfFor(locale: Locale): Intl.RelativeTimeFormat {
  const tag = LOCALE_TO_BCP47[locale] ?? 'en-US';
  let rtf = formatters.get(tag);
  if (!rtf) {
    rtf = new Intl.RelativeTimeFormat(tag, { numeric: 'always' });
    formatters.set(tag, rtf);
  }
  return rtf;
}

// Localized "in 23 hours" / "in 45 minutes" for a future timestamp. Rounds up
// so the user is never told a smaller wait than is actually enforced.
export function formatTimeUntil(iso: string, locale: Locale): string {
  const diffSec = Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 1000));
  const rtf = rtfFor(locale);
  if (diffSec < 3600) return rtf.format(Math.max(1, Math.ceil(diffSec / 60)), 'minute');
  return rtf.format(Math.ceil(diffSec / 3600), 'hour');
}

export function formatRelativeTime(iso: string, locale: Locale, justNow: string): string {
  const diffSec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diffSec < 60) return justNow;

  const rtf = rtfFor(locale);
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return rtf.format(-diffMin, 'minute');
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return rtf.format(-diffHr, 'hour');
  return rtf.format(-Math.floor(diffHr / 24), 'day');
}
