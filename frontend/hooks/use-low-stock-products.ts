'use client';

import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '@/lib/orders';
import { queryKeys } from '@/lib/query-keys';
import type { LowStockItem } from '@/types/orders';

export interface UseLowStockItemsReturn {
  items: LowStockItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useLowStockItems(): UseLowStockItemsReturn {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.lowStockItems(),
    queryFn: async () => {
      const res = await inventoryApi.getLowStockItems();
      return res.items;
    },
  });

  return {
    items: data ?? [],
    isLoading,
    error: error instanceof Error ? error.message : null,
    refetch: () => refetch(),
  };
}
