import type { Profile } from '../types/profile';
import { usePollCountry } from './usePollCountry';
import { useI18n } from '../i18n/I18nContext';
import { getCountryName } from '../utils/countries';

// The poll detail seen from one country (/p/:id/c/:code). Not a window of its
// own: the poll's detail (desktop modal and mobile sheet) takes a countryCode
// and swaps in what this hook returns - the heading, and a copy of the poll
// whose results are that country's, fed to the same PollOptions. The summary
// tiles keep the world's numbers, so the window reads country first, world
// beside it, in the poll's own design.
export function usePollCountryView(profile: Profile | undefined, countryCode: string | undefined) {
  const { locale } = useI18n();
  const { data } = usePollCountry(profile && countryCode ? profile.id : null, countryCode ?? null);
  if (!profile || !countryCode) return null;
  const name = getCountryName(countryCode, locale);
  const here = new Map((data?.country.options ?? []).map((o) => [o.optionId, o.n]));
  const total = data?.country.total ?? 0;
  const countryProfile: Profile = {
    ...profile,
    voteCount: total,
    results: data
      ? { total, registeredTotal: 0, countries: total ? 1 : 0, options: profile.options.map((o) => ({ optionId: o.id, n: here.get(o.id) ?? 0, registered: 0 })) }
      : undefined,
  };
  const cl = data?.country.leading;
  const wl = data?.world.leading;
  return {
    code: countryCode,
    name,
    loaded: !!data,
    total,
    countryProfile,
    // Both winners, only when they differ (a tie on either side names no
    // winner): the comparison card under the country's answers.
    differs: cl && !cl.tie && wl && !wl.tie && cl.optionId !== wl.optionId
      ? {
          country: { option: profile.options.find((o) => o.id === cl.optionId), pct: cl.pct },
          world: { option: profile.options.find((o) => o.id === wl.optionId), pct: wl.pct },
        }
      : null,
  };
}

export type PollCountryView = NonNullable<ReturnType<typeof usePollCountryView>>;

