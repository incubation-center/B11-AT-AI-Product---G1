import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMyProfile, updateProfile, deactivateAccount } from '@/lib/profile';
import { sendVerificationEmail, requestPasswordReset } from '@/lib/auth';
import { QUERY_KEYS } from '@/lib/query-keys';

export function useProfile() {
  return useQuery({
    queryKey: QUERY_KEYS.profile.me(),
    queryFn: getMyProfile,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fullName: string) => updateProfile(fullName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile.me() });
    },
  });
}

export function useDeactivateAccount() {
  return useMutation({
    mutationFn: deactivateAccount,
  });
}

export function useSendVerificationEmail() {
  return useMutation({
    mutationFn: sendVerificationEmail,
  });
}

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (email: string) => requestPasswordReset(email),
  });
}
