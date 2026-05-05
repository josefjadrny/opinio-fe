import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteProfile } from '../api/client';

export function useDeleteProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (profileId: string) => deleteProfile(profileId),
    onSuccess: (_data, profileId) => {
      queryClient.removeQueries({ queryKey: ['profile', profileId] });
      queryClient.removeQueries({ queryKey: ['person-breakdown', profileId] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['countryProfiles'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}
