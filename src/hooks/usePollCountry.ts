import { useQuery } from '@tanstack/react-query';
import { getPollCountry, isNotFound } from '../api/client';
import { useI18n } from '../i18n/I18nContext';

// One poll seen from one country (/p/:id/c/:code). Refreshes every 30s like
// the poll's per-country results; a 404 (deleted poll) stops the polling.
export function usePollCountry(profileId: string | null, code: string | null) {
  const { locale } = useI18n();
  return useQuery({
    queryKey: ['poll-country', profileId, code, locale],
    queryFn: () => getPollCountry(profileId!, code!, locale),
    enabled: profileId !== null && code !== null,
    staleTime: 15_000,
    refetchInterval: (query) => (isNotFound(query.state.error) ? false : 30_000),
    refetchIntervalInBackground: false,
    retry: (failureCount, error) => !isNotFound(error) && failureCount < 3,
  });
}
