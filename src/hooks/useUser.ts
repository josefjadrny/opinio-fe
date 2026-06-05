import { useQuery } from '@tanstack/react-query';
import { getUser } from '../api/client';
import { useI18n } from '../i18n/I18nContext';

export function useUser(userId: string | null) {
  const { locale } = useI18n();
  return useQuery({
    queryKey: ['user', userId, locale],
    queryFn: () => getUser(userId!, locale),
    enabled: userId !== null,
    staleTime: 30_000,
    retry: false,
  });
}
