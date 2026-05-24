import { useQuery } from '@tanstack/react-query';
import { getProfile, isNotFound } from '../api/client';

export function useProfile(profileId: string | null) {
  return useQuery({
    queryKey: ['profile', profileId],
    queryFn: () => getProfile(profileId!),
    enabled: profileId !== null,
    staleTime: 10_000,
    // A 404 is a dead id - don't retry it, and stop the 10s poll so an unknown
    // /p/:id doesn't hammer the API for as long as the tab stays open.
    retry: (failureCount, error) => !isNotFound(error) && failureCount < 3,
    refetchInterval: (query) => (isNotFound(query.state.error) ? false : 10_000),
  });
}
