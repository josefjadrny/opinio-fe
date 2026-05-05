import { useQuery } from '@tanstack/react-query';
import { getCountries } from '../api/client';

// One shared payload across the whole app — countries leaderboard, country
// detail counts, future map coloring all read from this single query.
// BE caches 60s; React Query keeps it fresh client-side at the same interval.
export function useCountries() {
  return useQuery({
    queryKey: ['countries'],
    queryFn: getCountries,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
