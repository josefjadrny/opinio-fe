import { useQuery } from '@tanstack/react-query';
import { getPersonBreakdown, isNotFound } from '../api/client';

export function usePersonBreakdown(profileId: string | null) {
  return useQuery({
    queryKey: ['person-breakdown', profileId],
    queryFn: () => getPersonBreakdown(profileId!),
    enabled: profileId !== null,
    staleTime: 30_000,
    // Mirror useProfile: a 404 is a dead id, so don't retry or keep polling.
    retry: (failureCount, error) => !isNotFound(error) && failureCount < 3,
    refetchInterval: (query) => (isNotFound(query.state.error) ? false : 30_000),
  });
}
