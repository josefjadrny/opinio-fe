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

// Time left to vote on a poll: whole days left (2 days 20 hours is "2
// days"), under a day hours rounded up (never "1 hour" with 1h59m left),
// under an hour minutes. `count` picks the caller's plural form, `label` is
// the number with its unit in the reader's language ("2 dny", "5 Stunden").
const unitFormatters = new Map<string, Intl.NumberFormat>();
export function formatTimeLeft(iso: string, locale: Locale): { count: number; label: string } {
  const diffMin = Math.max(1, Math.ceil((new Date(iso).getTime() - Date.now()) / 60_000));
  const [count, unit] = diffMin < 60 ? [diffMin, 'minute']
    : diffMin < 24 * 60 ? [Math.ceil(diffMin / 60), 'hour']
      : [Math.floor(diffMin / (24 * 60)), 'day'];
  const tag = `${LOCALE_TO_BCP47[locale] ?? 'en-US'}:${unit}`;
  let f = unitFormatters.get(tag);
  if (!f) {
    f = new Intl.NumberFormat(LOCALE_TO_BCP47[locale] ?? 'en-US', { style: 'unit', unit, unitDisplay: 'long' });
    unitFormatters.set(tag, f);
  }
  return { count, label: f.format(count) };
}

const dateFormatters = new Map<string, Intl.DateTimeFormat>();
// A poll's end date, "May 24, 2027" / "24. 5. 2027", in the reader's locale.
export function formatPollDate(iso: string, locale: Locale): string {
  const tag = LOCALE_TO_BCP47[locale] ?? 'en-US';
  let f = dateFormatters.get(tag);
  if (!f) {
    f = new Intl.DateTimeFormat(tag, { day: 'numeric', month: 'short', year: 'numeric' });
    dateFormatters.set(tag, f);
  }
  return f.format(new Date(iso));
}

const dateTimeFormatters = new Map<string, Intl.DateTimeFormat>();
// The exact end of a poll, "Nov 22, 2026, 4:57 AM", for its tooltip.
export function formatPollDateTime(iso: string, locale: Locale): string {
  const tag = LOCALE_TO_BCP47[locale] ?? 'en-US';
  let f = dateTimeFormatters.get(tag);
  if (!f) {
    f = new Intl.DateTimeFormat(tag, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
    dateTimeFormatters.set(tag, f);
  }
  return f.format(new Date(iso));
}
