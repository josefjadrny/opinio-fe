import { useQuery } from '@tanstack/react-query';
import { getOnFireUsers, getTopVoters, getTrendingCountries } from '../api/client';
import type { CountryMetric, VoterMetric } from '../types/api';

export function useTopVoters(country?: string, metric: VoterMetric = 'given') {
  return useQuery({
    queryKey: ['top-voters', country ?? null, metric],
    queryFn: () => getTopVoters(country, metric),
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

export function useTrendingCountries(metric: CountryMetric = 'total') {
  return useQuery({
    queryKey: ['trending-countries', metric],
    queryFn: () => getTrendingCountries(metric),
    staleTime: 60_000,
  });
}
