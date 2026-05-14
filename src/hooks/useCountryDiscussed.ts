import { useQuery } from '@tanstack/react-query';
import { getCountryDiscussed } from '../api/client';

export function useCountryDiscussed(countryCode: string | null) {
  return useQuery({
    queryKey: ['countryDiscussed', countryCode],
    queryFn: () => getCountryDiscussed(countryCode!),
    enabled: !!countryCode,
    staleTime: 60_000,
  });
}
