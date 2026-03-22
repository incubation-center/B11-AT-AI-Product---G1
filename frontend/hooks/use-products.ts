'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { deactivateProduct, listProducts } from '@/lib/products';
import { queryKeys } from '@/lib/query-keys';

type ProductListParams = {
  q?: string;
  page?: number;
  page_size?: number;
  include_inactive?: boolean;
};

export function useProducts(params: ProductListParams = {}) {
  return useQuery({
    queryKey: queryKeys.productList(params),
    queryFn: () => listProducts(params),
  });
}

export function useDeactivateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deactivateProduct,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.products });
    },
  });
}
