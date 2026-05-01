import { useQuery } from '@tanstack/react-query';
import { getOnFireUsers, getTopVoters } from '../api/client';

export function useTopVoters(country?: string) {
  return useQuery({
    queryKey: ['top-voters', country ?? null],
    queryFn: () => getTopVoters(country),
    staleTime: 60_000,
  });
}

export function useOnFireUsers(country?: string) {
  return useQuery({
    queryKey: ['on-fire', country ?? null],
    queryFn: () => getOnFireUsers(country),
    staleTime: 60_000,
  });
}
