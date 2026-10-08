import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getComments, postComment, deleteComment, searchUsers, isNotFound } from '../api/client';
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
    // Same cadence as the profile poll that moves the count, so the list and
    // the count converge. Stops while the tab is hidden (react-query default).
    // The WS socket is not an option here: it is owned by HotBanner and is
    // closed on mobile and on /p/:id, the routes a thread is open on.
    refetchInterval: 30_000,
    retry: (failureCount, error) => !isNotFound(error) && failureCount < 3,
  });
}

export function usePostComment(profileId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ body, parentId }: { body: string; parentId?: string | null }) => postComment(profileId, body, parentId),
    onSuccess: (comment: Comment) => {
      // Patch locally so the thread answers at once, and bump the count
      // everywhere the profile is cached; the next poll reconciles. A root is
      // prepended (newest first); a reply goes after the last reply of its
      // root, matching the BE's flat order (root, then its replies oldest first).
      queryClient.setQueryData<CommentsResponse>(['comments', profileId], (old) => {
        if (!old) return { comments: [comment], total: 1 };
        if (!comment.parentId) return { comments: [comment, ...old.comments], total: old.total + 1 };
        const rootAt = old.comments.findIndex((c) => c.id === comment.parentId);
        if (rootAt < 0) return { comments: [comment, ...old.comments], total: old.total + 1 };
        let at = rootAt + 1;
        while (at < old.comments.length && old.comments[at].parentId === comment.parentId) at++;
        return { comments: [...old.comments.slice(0, at), comment, ...old.comments.slice(at)], total: old.total + 1 };
      });
      bumpCommentCount(queryClient, profileId, 1);
    },
  });
}

// How long the thread's collapse animation runs before the row really leaves
// the cache. CommentThread animates against the same number.
export const COMMENT_LEAVE_MS = 300;

// Soft delete of one's own comment (the BE also lets an admin). The row
// leaves the thread once its collapse has played and the count drops where
// the profile is cached. A root takes its replies with it, as it does on the BE.
export function useDeleteComment(profileId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId),
    onSuccess: (_data, commentId) => {
      // Counted now, not when the timer fires: a poll landing inside the
      // collapse may already have dropped the rows from the list.
      const gone = (c: Comment) => c.id === commentId || c.parentId === commentId;
      const removed = queryClient.getQueryData<CommentsResponse>(['comments', profileId])?.comments.filter(gone).length || 1;
      window.setTimeout(() => {
        queryClient.setQueryData<CommentsResponse>(['comments', profileId], (old) =>
          old ? { comments: old.comments.filter((c) => !gone(c)), total: Math.max(0, old.total - removed) } : old,
        );
        bumpCommentCount(queryClient, profileId, -removed);
      }, COMMENT_LEAVE_MS);
    },
  });
}

function bumpCommentCount(queryClient: ReturnType<typeof useQueryClient>, profileId: string, delta: number) {
  const bump = (p: Profile) =>
    p.id === profileId && p.commentCount !== undefined ? { ...p, commentCount: Math.max(0, p.commentCount + delta) } : p;
  queryClient.setQueriesData<Profile>({ queryKey: ['profile', profileId] }, (old) => (old ? bump(old) : old));
  queryClient.setQueriesData<ProfilesResponse>({ queryKey: ['profiles'] }, (old) =>
    old ? { ...old, profiles: old.profiles.map(bump) } : old,
  );
}

// Mention autocomplete. `q` is the handle prefix after the "@" at the caret;
// empty means no popover, so nothing is asked. A prefix stays fresh for a
// minute - the handle list does not move fast enough to matter.
export function useUserSearch(q: string) {
  return useQuery({
    queryKey: ['userSearch', q],
    queryFn: () => searchUsers(q),
    enabled: q.length > 0,
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });
}
