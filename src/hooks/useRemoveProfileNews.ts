import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeProfileNews } from '../api/client';

// The author takes the news link off their opinio. Every cached copy that
// carries the opinio's newsId (detail, feeds, country and user lists) and the
// story's own opinio list refetch.
export function useRemoveProfileNews() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profileId: string) => removeProfileNews(profileId),
    onSuccess: (_data, profileId) => {
      queryClient.invalidateQueries({ queryKey: ['profile', profileId] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['countryProfiles'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['news'] });
    },
  });
}
