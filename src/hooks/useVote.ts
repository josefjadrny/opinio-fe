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
      queryClient.setQueriesData<UserDetailResponse>({ queryKey: ['user'] }, (old) => {
        if (!old) return old;
        const profilesPatched = old.profiles.some((p) => p.id === data.profile.id)
          ? old.profiles.map((p) => p.id === data.profile.id ? { ...p, likes: data.profile.likes, dislikes: data.profile.dislikes } : p)
          : old.profiles;
        // Received totals belong to the profile's author — bump them when the
        // user page being viewed is that author's.
        const isAuthorDetail = data.profile.addedById !== null && old.id === data.profile.addedById;
        return {
          ...old,
          profiles: profilesPatched,
          totalLikesReceived: isAuthorDetail && vars.type === 'like' ? old.totalLikesReceived + 1 : old.totalLikesReceived,
          totalDislikesReceived: isAuthorDetail && vars.type === 'dislike' ? old.totalDislikesReceived + 1 : old.totalDislikesReceived,
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
