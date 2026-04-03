import { useQuery } from '@tanstack/react-query';
import { getCountryProfiles } from '../api/client';

export function useCountryProfiles(countryCode: string | null) {
  return useQuery({
    queryKey: ['countryProfiles', countryCode],
    queryFn: () => getCountryProfiles(countryCode!),
    enabled: !!countryCode,
    staleTime: 60_000,
  });
}
