import { useQuery } from '@tanstack/react-query';
import { getCountryDiscussed } from '../api/client';
import { useI18n } from '../i18n/I18nContext';

export function useCountryDiscussed(countryCode: string | null) {
  const { locale } = useI18n();
  return useQuery({
    queryKey: ['countryDiscussed', countryCode, locale],
    queryFn: () => getCountryDiscussed(countryCode!, locale),
    enabled: !!countryCode,
    staleTime: 60_000,
  });
}
