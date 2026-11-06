import { useQuery, keepPreviousData } from '@tanstack/react-query';
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
