import { useMutation, useQueryClient } from '@tanstack/react-query';
import { vote } from '../api/client';
import type { VoteType, VoteResponse, MeResponse } from '../types/api';

export function useVote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ profileId, type }: { profileId: string; type: VoteType }) =>
      vote(profileId, type),
    onSuccess: (data: VoteResponse) => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['countryProfiles'] });
      queryClient.setQueryData<MeResponse>(['me'], (old) =>
        old ? { ...old, voteAllowance: data.voteAllowance } : old
      );
    },
  });
}
