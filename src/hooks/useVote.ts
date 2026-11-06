import { useMutation, useQueryClient } from '@tanstack/react-query';
import { vote } from '../api/client';
import type { MeResponse, VoteResponse } from '../types/api';
import type { Profile } from '../types/profile';

// Vote on a poll. The response carries the fresh per-option totals and the
// caller's vote, so the poll page updates without a refetch.
export function useVote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ profileId, optionId, turnstileToken }: { profileId: string; optionId: string; turnstileToken?: string }) =>
      vote(profileId, optionId, turnstileToken),
    onSuccess: (data: VoteResponse, vars) => {
      queryClient.setQueriesData<Profile>({ queryKey: ['profile', vars.profileId] }, (old) =>
        old ? { ...old, results: data.results, myVote: data.myVote, voteCount: data.results.total } : old,
      );
      queryClient.setQueryData<MeResponse>(['me'], (old) =>
        old ? { ...old, voteAllowance: data.voteAllowance } : old,
      );
      queryClient.invalidateQueries({ queryKey: ['profile-countries', vars.profileId] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['country-polls'] });
      queryClient.invalidateQueries({ queryKey: ['countries'] });
      const myId = queryClient.getQueryData<MeResponse>(['me'])?.user.id;
      if (myId) queryClient.invalidateQueries({ queryKey: ['user', myId] });
    },
  });
}
