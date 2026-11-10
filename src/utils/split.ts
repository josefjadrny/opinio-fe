import type { CountryPollItem } from '../types/api';
import { formatNumber } from './formatNumber';

export type SplitRow = { id: string; color: string; text: string; n: number };

export const splitPct = (n: number, total: number) => `${total ? Math.round((n / total) * 100) : 0}%`;

/** The rows ranked biggest first - the bar alone only says "mostly red". */
export const rankSplit = (rows: SplitRow[]) => [...rows].sort((a, b) => b.n - a.n);

/** The popup's text for screen readers: "Yes: 12 (60%), No: 8 (40%)". */
export const splitLabel = (rows: SplitRow[], total: number) =>
  rankSplit(rows).map((x) => `${x.text}: ${formatNumber(x.n)} (${splitPct(x.n, total)})`).join(', ');

/** One country's answers to one poll, in the poll's own order and colours. */
export function countryRows(item: CountryPollItem): SplitRow[] {
  const here = new Map((item.country.options ?? []).map((o) => [o.optionId, o.n]));
  return [...item.poll.options]
    .sort((a, b) => a.position - b.position)
    .map((o) => ({ id: o.id, color: o.color, text: o.text, n: here.get(o.id) ?? 0 }));
}
