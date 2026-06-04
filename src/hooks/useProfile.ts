import { useQuery } from '@tanstack/react-query';
import { getProfile, isNotFound } from '../api/client';
import { useI18n } from '../i18n/I18nContext';

export function useProfile(profileId: string | null) {
  const { locale } = useI18n();
  return useQuery({
    queryKey: ['profile', profileId, locale],
    queryFn: () => getProfile(profileId!, locale),
    enabled: profileId !== null,
    staleTime: 10_000,
    // A 404 is a dead id - don't retry it, and stop the 10s poll so an unknown
    // /p/:id doesn't hammer the API for as long as the tab stays open.
    retry: (failureCount, error) => !isNotFound(error) && failureCount < 3,
    refetchInterval: (query) => (isNotFound(query.state.error) ? false : 10_000),
  });
}
