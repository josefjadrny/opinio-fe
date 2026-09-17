import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getComments, postComment, isNotFound } from '../api/client';
import type { Comment, CommentsResponse, ProfilesResponse } from '../types/api';
import type { Profile } from '../types/profile';

// `enabled` is the feature switch: callers pass `profile.commentCount !== undefined`,
// so a BE that does not serve comments yet is never even asked.
export function useComments(profileId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['comments', profileId],
    queryFn: () => getComments(profileId),
    enabled,
    staleTime: 30_000,
    retry: (failureCount, error) => !isNotFound(error) && failureCount < 3,
  });
}

export function usePostComment(profileId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => postComment(profileId, body),
    onSuccess: (comment: Comment) => {
      // Prepend locally so the thread answers at once, and bump the count
      // everywhere the profile is cached; the next poll reconciles.
      queryClient.setQueryData<CommentsResponse>(['comments', profileId], (old) =>
        old ? { comments: [comment, ...old.comments], total: old.total + 1 } : { comments: [comment], total: 1 },
      );
      const bump = (p: Profile) =>
        p.id === profileId && p.commentCount !== undefined ? { ...p, commentCount: p.commentCount + 1 } : p;
      queryClient.setQueriesData<Profile>({ queryKey: ['profile', profileId] }, (old) => (old ? bump(old) : old));
      queryClient.setQueriesData<ProfilesResponse>({ queryKey: ['profiles'] }, (old) =>
        old ? { ...old, profiles: old.profiles.map(bump) } : old,
      );
    },
  });
}
