import type { PollCountry } from '../types/api';

export type OptionCountryRow = { code: string; n: number };

/** Where one answer's votes came from: every country that gave it a vote,
 *  most votes first (then the code, so the order is stable). */
export function optionCountries(countries: PollCountry[], optionId: string): OptionCountryRow[] {
  return countries
    .map((c) => ({ code: c.code, n: c.options.find((o) => o.optionId === optionId)?.n ?? 0 }))
    .filter((c) => c.n > 0)
    .sort((a, b) => b.n - a.n || a.code.localeCompare(b.code));
}
