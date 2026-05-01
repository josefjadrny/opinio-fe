import { useQuery } from '@tanstack/react-query';
import { getUser } from '../api/client';

export function useUser(userId: string | null) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUser(userId!),
    enabled: userId !== null,
    staleTime: 30_000,
    retry: false,
  });
}
