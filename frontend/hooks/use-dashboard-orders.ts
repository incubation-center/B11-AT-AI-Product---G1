'use client';

import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '@/lib/orders';
import { queryKeys } from '@/lib/query-keys';
import type { Order } from '@/types/orders';

export interface UseDashboardOrdersReturn {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDashboardOrders(): UseDashboardOrdersReturn {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.dashboardOrders(),
    queryFn: async () => {
      const res = await ordersApi.getAll();
      return res?.orders ?? [];
    },
  });

  return {
    orders: data ?? [],
    isLoading,
    error: error instanceof Error ? error.message : null,
    refetch: () => refetch(),
  };
}
