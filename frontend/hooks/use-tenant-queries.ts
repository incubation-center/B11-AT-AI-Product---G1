import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { updateMyTenant, getTenantStatus } from '@/lib/auth';
import { deactivateMyTenant, uploadTenantAsset } from '@/lib/tenants';
import { QUERY_KEYS } from '@/lib/query-keys';

export function useTenantStatus() {
  return useQuery({
    queryKey: QUERY_KEYS.tenants.status(),
    queryFn: getTenantStatus,
  });
}

export function useUpdateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateMyTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tenants.status() });
    },
  });
}

export function useDeactivateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deactivateMyTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tenants.status() });
    },
  });
}

export function useUploadTenantAsset() {
  return useMutation({
    mutationFn: ({ type, file }: { type: 'logo' | 'banner'; file: File }) =>
      uploadTenantAsset(type, file),
  });
}
