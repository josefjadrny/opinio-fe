import { useQuery } from '@tanstack/react-query';
import {
  getLeaderboardCountries, getLeaderboardProfiles,
  getTopVoters, getTrendingCountries, getTrendingProfiles,
} from '../api/client';
import { useI18n } from '../i18n/I18nContext';
import type { CountryMetric, VoterMetric } from '../types/api';

export function useTopVoters(country?: string, metric: VoterMetric = 'received', enabled = true) {
  return useQuery({
    queryKey: ['top-voters', country ?? null, metric],
    queryFn: () => getTopVoters(country, metric),
    staleTime: 60_000,
    enabled,
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

// All-time Leaderboard hooks. `enabled` lets the modal skip the fetch for boards
// that aren't the active one (only one leaderboard board renders at a time).
export function useLeaderboardProfiles(country?: string, enabled = true) {
  const { locale } = useI18n();
  return useQuery({
    queryKey: ['leaderboard-profiles', country ?? null, locale],
    queryFn: () => getLeaderboardProfiles(country, locale),
    staleTime: 60_000,
    enabled,
  });
}

export function useLeaderboardCountries(enabled = true) {
  return useQuery({
    queryKey: ['leaderboard-countries'],
    queryFn: () => getLeaderboardCountries(),
    staleTime: 60_000,
    enabled,
  });
}
