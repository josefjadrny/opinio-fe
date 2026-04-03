import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { subscribeRealtime } from '../api/client';
import type { ProfilesResponse } from '../types/api';

export function useRealtimeUpdates() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = subscribeRealtime((event) => {
      if (event.kind === 'vote') {
        // Patch all cached profile lists with the incremental vote
        queryClient.setQueriesData<ProfilesResponse>(
          { queryKey: ['profiles'] },
          (old) => {
            if (!old) return old;
            return {
              ...old,
              profiles: old.profiles.map((p) =>
                p.id === event.profileId
                  ? {
                      ...p,
                      likes: p.likes + (event.data.likes ?? 0),
                      dislikes: p.dislikes + (event.data.dislikes ?? 0),
                    }
                  : p,
              ),
              recentlyAdded: old.recentlyAdded.map((p) =>
                p.id === event.profileId
                  ? {
                      ...p,
                      likes: p.likes + (event.data.likes ?? 0),
                      dislikes: p.dislikes + (event.data.dislikes ?? 0),
                    }
                  : p,
              ),
            };
          },
        );
      }
    });

    return unsubscribe;
  }, [queryClient]);
}
