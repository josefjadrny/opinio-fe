import { useQuery } from '@tanstack/react-query';
import { getProfile } from '../api/client';

export function useProfile(profileId: string | null) {
  return useQuery({
    queryKey: ['profile', profileId],
    queryFn: () => getProfile(profileId!),
    enabled: profileId !== null,
    staleTime: 10_000,
  });
}
