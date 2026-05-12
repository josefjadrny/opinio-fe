import { useMutation, useQueryClient } from '@tanstack/react-query';
import { vote } from '../api/client';
import type { VoteType, VoteResponse, MeResponse, ProfilesResponse, UserDetailResponse } from '../types/api';
import type { Profile } from '../types/profile';
import { lockOrderFor5s } from '../utils/voteLock';

export function useVote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ profileId, type }: { profileId: string; type: VoteType }) =>
      vote(profileId, type),
    onSuccess: (data: VoteResponse, vars) => {
      // Immediately patch counts - order stays frozen for 5s, then unlock triggers invalidation.
      // Merge rather than replace so list-only fields (e.g. `label`) survive until reinvalidation.
      const patch = (p: Profile) => p.id === data.profile.id ? { ...p, ...data.profile } : p;
      queryClient.setQueriesData<ProfilesResponse>({ queryKey: ['profiles'] }, (old) =>
        old ? { ...old, profiles: old.profiles.map(patch) } : old
      );
      queryClient.setQueryData<Profile>(['profile', data.profile.id], (old) =>
        old ? { ...old, ...data.profile } : data.profile
      );
      const myId = queryClient.getQueryData<MeResponse>(['me'])?.user?.id ?? null;
      queryClient.setQueriesData<UserDetailResponse>({ queryKey: ['user'] }, (old) => {
        if (!old) return old;
        const profilesPatched = old.profiles.some((p) => p.id === data.profile.id)
          ? old.profiles.map((p) => p.id === data.profile.id ? { ...p, likes: data.profile.likes, dislikes: data.profile.dislikes } : p)
          : old.profiles;
        const isMyDetail = myId !== null && old.id === myId;
        return {
          ...old,
          profiles: profilesPatched,
          totalLikesCast: isMyDetail && vars.type === 'like' ? old.totalLikesCast + 1 : old.totalLikesCast,
          totalDislikesCast: isMyDetail && vars.type === 'dislike' ? old.totalDislikesCast + 1 : old.totalDislikesCast,
        };
      });
      lockOrderFor5s(() => {
        queryClient.invalidateQueries({ queryKey: ['profiles'] });
        queryClient.invalidateQueries({ queryKey: ['countryProfiles'] });
      });
      queryClient.setQueryData<MeResponse>(['me'], (old) =>
        old ? { ...old, voteAllowance: data.voteAllowance } : old
      );
    },
  });
}
