import { useQuery } from '@tanstack/react-query';
import { getProfileCountries, isNotFound } from '../api/client';

// One poll's answers per voter country - the map tint and the Countries tab.
// registered = signed-in voters only.
//
// Deliberately NO keepPreviousData: on an A -> B poll switch it would hand
// back A's countries while B is in flight, and the map would fade in the wrong
// colours before correcting itself.
export function useProfileCountries(profileId: string | null, registered = false) {
  return useQuery({
    queryKey: ['profile-countries', profileId, registered],
    queryFn: () => getProfileCountries(profileId!, registered),
    enabled: profileId !== null,
    staleTime: 15_000,
    refetchInterval: (query) => (isNotFound(query.state.error) ? false : 30_000),
    refetchIntervalInBackground: false,
    retry: (failureCount, error) => !isNotFound(error) && failureCount < 3,
  });
}
