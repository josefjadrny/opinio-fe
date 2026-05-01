import { useQuery } from '@tanstack/react-query';
import { getTopProfiles, getTopVoters } from '../api/client';

export function useTopVoters(country?: string) {
  return useQuery({
    queryKey: ['top-voters', country ?? null],
    queryFn: () => getTopVoters(country),
    staleTime: 60_000,
  });
}

export function useTopProfiles(country?: string) {
  return useQuery({
    queryKey: ['top-profiles', country ?? null],
    queryFn: () => getTopProfiles(country),
    staleTime: 60_000,
  });
}
