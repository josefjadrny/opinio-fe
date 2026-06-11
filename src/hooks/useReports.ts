import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportProfile, getReports, validateReportedProfile } from '../api/client';

export function useReportProfile() {
  return useMutation({
    mutationFn: ({ profileId, reason }: { profileId: string; reason: string }) =>
      reportProfile(profileId, reason),
  });
}

// Admin-only triage list. retry:false so a 403 for non-admins resolves once.
export function useReports() {
  return useQuery({
    queryKey: ['reports'],
    queryFn: getReports,
    retry: false,
  });
}

export function useValidateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (profileId: string) => validateReportedProfile(profileId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports'] }),
  });
}
