import { useQuery, useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import { getCountryPolls } from '../api/client';
import { useI18n } from '../i18n/I18nContext';

// Polls people from one country voted on, with that country's answer next to
// the world's. The map hover reads limit 3 (after a short dwell, so sweeping
// across Europe is not 20 requests), the country page limit 20.
export function useCountryPolls(code: string | null, sort: 'top' | 'recent', limit: number) {
  const { locale } = useI18n();
  return useQuery({
    queryKey: ['country-polls', code, sort, limit, locale],
    queryFn: () => getCountryPolls(code!, sort, limit, locale),
    enabled: !!code,
    staleTime: 60_000,
    placeholderData: limit > 3 ? keepPreviousData : undefined,
  });
}

const PAGE = 20;

// The country page's list: pages of 20 by "top", fetched as the reader scrolls.
// A short page means the end. "top" leans on the last 24h, so the order can
// shift between two page loads - the list drops a poll it already shows.
export function useCountryPollsInfinite(code: string | null) {
  const { locale } = useI18n();
  return useInfiniteQuery({
    queryKey: ['country-polls-infinite', code, locale],
    queryFn: ({ pageParam }) => getCountryPolls(code!, 'top', PAGE, locale, pageParam),
    initialPageParam: 0,
    // Stop on a short page, and on one that brought nothing new - an API that
    // ignores `offset` returns page one again, and without this the list would
    // re-request it forever.
    getNextPageParam: (last, pages) => {
      if (last.items.length < PAGE) return undefined;
      const seen = new Set(pages.slice(0, -1).flatMap((pg) => pg.items.map((it) => it.poll.id)));
      if (pages.length > 1 && last.items.every((it) => seen.has(it.poll.id))) return undefined;
      return pages.length * PAGE;
    },
    enabled: !!code,
    staleTime: 60_000,
  });
}
