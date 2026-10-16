import { useQuery } from '@tanstack/react-query';
import { getLatestNews } from '../api/client';
import { useI18n } from '../i18n/I18nContext';

// The 4 newest news items for the map caption's rotation. A round writes at
// most one item every 20 minutes and the API caches the list for a minute, so
// a minute's poll is as fresh as it gets.
export function useLatestNews(enabled: boolean) {
  const { locale } = useI18n();
  return useQuery({
    queryKey: ['news', 'latest', locale],
    queryFn: () => getLatestNews(locale, 4),
    enabled,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
