import { useQuery } from '@tanstack/react-query';
import { getCountries } from '../api/client';

// One shared payload across the whole app — countries leaderboard, country
// detail counts, and map colouring all read from this single query.
//
// pollWhileVisible: when true, the query self-refreshes every 5 min so a map
// left open reflects new votes instead of freezing on its first fetch. Only the
// map surfaces pass true, and only while the map is actually on screen, so we
// never poll for consumers that just read the snapshot (tooltip, country modal)
// or when the map is collapsed. refetchIntervalInBackground:false pauses polling
// while the tab/app is backgrounded. All observers share the ['countries'] query,
// so the poll runs whenever at least one visible map is mounted.
export function useCountries(pollWhileVisible = false) {
  return useQuery({
    queryKey: ['countries'],
    queryFn: getCountries,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchInterval: pollWhileVisible ? 300_000 : false,
    refetchIntervalInBackground: false,
  });
}
