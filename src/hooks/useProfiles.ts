import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { getProfiles } from '../api/client';
import type { ProfileFilters } from '../types/api';
import { useI18n } from '../i18n/I18nContext';

export function useProfiles(filters: ProfileFilters) {
  const { locale } = useI18n();
  return useQuery({
    queryKey: ['profiles', filters, locale],
    queryFn: () => getProfiles(filters, locale),
    placeholderData: keepPreviousData,
  });
}
