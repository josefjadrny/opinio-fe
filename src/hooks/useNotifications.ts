import { useInfiniteQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useCallback } from 'react';
import { getNotifications, markNotificationsSeen, clickNotification } from '../api/client';
import { useI18n } from '../i18n/I18nContext';
import type { MeResponse, NotificationItem, NotificationKind, NotificationsResponse } from '../types/api';

// The bell's panel. One panel load = one `shownAt` (the server's time of the
// first page), the bound /seen and /click take, so the query is never
// refetched in place: it lives only while the panel is mounted (gcTime 0) and
// every open starts over with a fresh first page.

// Lines one click clears, by the view the click opens (spec "Read state").
const VIEW_KINDS: Record<NotificationKind, NotificationKind[]> = {
  milestone: ['milestone', 'vote'],
  vote: ['milestone', 'vote'],
  comment: ['comment', 'mention'],
  mention: ['comment', 'mention'],
  support: ['support'],
};

// The click POST still in flight when the panel closes. The next open waits
// for it, or a quick reopen could load the line before the server cleared it.
let pendingClick: Promise<unknown> = Promise.resolve();

export function useNotifications() {
  const { locale } = useI18n();
  return useInfiniteQuery({
    queryKey: ['notifications', locale],
    queryFn: async ({ pageParam }) => {
      await pendingClick;
      return getNotifications(pageParam, locale);
    },
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    staleTime: Infinity,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

// Writes the badge straight into the /api/me cache. An /api/me poll already in
// flight was started before the change and would put the old count back for
// one poll, so it is cancelled first.
function useSetUnseen() {
  const queryClient = useQueryClient();
  return useCallback(async (n: number) => {
    await queryClient.cancelQueries({ queryKey: ['me'] });
    queryClient.setQueryData<MeResponse>(['me'], (old) => (old ? { ...old, unseenNotifications: n } : old));
  }, [queryClient]);
}

export function useMarkNotificationsSeen() {
  const setUnseen = useSetUnseen();
  return useCallback((shownAt: string) => {
    markNotificationsSeen(shownAt)
      .then((r) => setUnseen(r.unseenNotifications))
      .catch(() => { /* the badge stays; the next open retries */ });
  }, [setUnseen]);
}

export function useClickNotification() {
  const queryClient = useQueryClient();
  const { locale } = useI18n();
  const setUnseen = useSetUnseen();
  return useCallback((item: NotificationItem, shownAt: string) => {
    // Grey the same set the server clears, locally and at once.
    const kinds = VIEW_KINDS[item.kind];
    queryClient.setQueryData<InfiniteData<NotificationsResponse>>(['notifications', locale], (old) => old && {
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        items: page.items.map((i) =>
          i.id === item.id
          // A support line has no opinio and no siblings: one open line per ticket.
          || (!!item.profile && i.profile?.id === item.profile.id && kinds.includes(i.kind) && !i.clicked && i.updatedAt <= shownAt)
            ? { ...i, clicked: true, seen: true }
            : i),
      })),
    });
    pendingClick = clickNotification(item.id, shownAt)
      .then((r) => setUnseen(r.unseenNotifications))
      .catch(() => { /* stays highlighted; harmless */ });
  }, [queryClient, locale, setUnseen]);
}
