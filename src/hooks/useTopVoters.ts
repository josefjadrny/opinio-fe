import { useQuery } from '@tanstack/react-query';
import { getTopVoters, getTrendingCountries, getTrendingProfiles } from '../api/client';
import { useI18n } from '../i18n/I18nContext';
import type { CountryMetric, VoterMetric } from '../types/api';

export function useTopVoters(country?: string, metric: VoterMetric = 'received') {
  return useQuery({
    queryKey: ['top-voters', country ?? null, metric],
    queryFn: () => getTopVoters(country, metric),
    staleTime: 60_000,
  });
}

export function useTrendingProfiles(country?: string, metric: CountryMetric = 'total') {
  const { locale } = useI18n();
  return useQuery({
    queryKey: ['trending-profiles', country ?? null, metric, locale],
    queryFn: () => getTrendingProfiles(country, metric, locale),
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
