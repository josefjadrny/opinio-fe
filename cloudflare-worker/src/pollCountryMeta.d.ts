// Types for pollCountryMeta.js, which the SPA imports from the worker's source.
export declare const POLL_COUNTRY_MIN_VOTES: number;

export declare function pollCountryMeta(
  lang: string,
  countryName: string,
  item: {
    poll: { name: string; options: { id: string; position: number; text: string }[] };
    country: { total: number; leading: { optionId: string; tie: boolean } | null; options: { optionId: string; n: number }[] };
    world: { total: number; leading: { optionId: string; tie: boolean } | null };
  },
): { title: string; description: string };
