// Stats category type + URL-slug mapping, kept out of StatsModal.tsx so that
// file only exports its component (react-refresh/only-export-components).
export type StatsCategory = 'voters' | 'onFire' | 'countries';

export function slugToCategory(slug?: string): StatsCategory {
  if (slug === 'trending-countries') return 'countries';
  if (slug === 'top-voters') return 'voters';
  return 'onFire';
}
