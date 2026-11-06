// Stats category type + URL-slug mapping, kept out of StatsModal.tsx so that
// file only exports its component (react-refresh/only-export-components).
//   /stats                     polls
//   /stats/trending-countries  countries
//   /stats/top-voters          people
export type StatsCategory = 'profiles' | 'countries' | 'people';

export function slugToCategory(slug?: string): StatsCategory {
  if (slug === 'trending-countries') return 'countries';
  if (slug === 'top-voters') return 'people';
  return 'profiles';
}
