import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listProducts,
  deactivateProduct,
  createProduct,
  updateProduct,
  syncProductToRag,
  type UpdateProductPayload,
} from '@/lib/products';

export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) =>
    [...productKeys.lists(), { ...filters }] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
};

export function useProducts(params?: {
  q?: string;
  page?: number;
  page_size?: number;
  include_inactive?: boolean;
}) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => listProducts(params),
  });
}

export function useDeactivateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deactivateProduct,
    onSuccess: () => {
      // Invalidate all product queries
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      // Invalidate all product queries
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateProductPayload;
    }) => updateProduct(id, payload),
    onSuccess: () => {
      // Invalidate all product queries
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

export function useSyncProductToRag() {
  return useMutation({
    mutationFn: (id: string) => syncProductToRag(id),
  });
}

export function useRestoreProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => updateProduct(id, { is_active: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}
