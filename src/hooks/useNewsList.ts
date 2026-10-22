import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { getNews, getNewsList } from '../api/client';
import { useI18n } from '../i18n/I18nContext';
import { useFilters } from '../context/useFilters';

const PAGE = 20;

// The news list under the feed's own filters (country + categories), newest
// first, paged by the last item's time.
export function useNewsList(poll = false) {
  const { locale } = useI18n();
  const { country, roles } = useFilters();
  return useInfiniteQuery({
    queryKey: ['news', 'list', locale, country ?? '', roles.join(',')],
    queryFn: ({ pageParam }) => getNewsList(locale, { country, roles, before: pageParam, limit: PAGE }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.items.length < PAGE ? undefined : last.items[last.items.length - 1].createdAt),
    staleTime: 30_000,
    refetchInterval: poll ? 30_000 : false,
  });
}

export function useNewsItem(id: string | null) {
  const { locale } = useI18n();
  return useQuery({
    queryKey: ['news', 'item', id, locale],
    queryFn: () => getNews(id!, locale),
    enabled: !!id,
    staleTime: 5 * 60_000,
  });
}
