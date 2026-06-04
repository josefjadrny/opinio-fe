import { useQuery } from '@tanstack/react-query';
import { getCountryProfiles } from '../api/client';
import { useI18n } from '../i18n/I18nContext';

export function useCountryProfiles(countryCode: string | null) {
  const { locale } = useI18n();
  return useQuery({
    queryKey: ['countryProfiles', countryCode, locale],
    queryFn: () => getCountryProfiles(countryCode!, locale),
    enabled: !!countryCode,
    staleTime: 60_000,
  });
}
