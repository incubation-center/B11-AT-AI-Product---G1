'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi, ordersApi } from '@/lib/orders';
import { queryKeys } from '@/lib/query-keys';
import type { DashboardMetrics } from '@/types/orders';

export type DateRangeFilter = 'daily' | 'weekly' | 'monthly';

export interface UseDashboardMetricsReturn {
  metrics: DashboardMetrics | null;
  dateRange: DateRangeFilter;
  setDateRange: (range: DateRangeFilter) => void;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDashboardMetrics(): UseDashboardMetricsReturn {
  const [dateRange, setDateRange] = useState<DateRangeFilter>('weekly');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.dashboardMetrics(dateRange),
    queryFn: async () => {
      const [ordersResult, lowStockResult] = await Promise.all([
        ordersApi.getAll(),
        inventoryApi.getLowStockItems(),
      ]);

      const now = new Date();
      const filteredOrders = (ordersResult?.orders ?? []).filter((order) => {
        const createdAt = new Date(order.created_at);
        if (dateRange === 'daily') {
          return now.getTime() - createdAt.getTime() <= 24 * 60 * 60 * 1000;
        }
        if (dateRange === 'weekly') {
          return now.getTime() - createdAt.getTime() <= 7 * 24 * 60 * 60 * 1000;
        }
        return now.getTime() - createdAt.getTime() <= 30 * 24 * 60 * 60 * 1000;
      });

      const totals = filteredOrders.reduce(
        (acc, order) => {
          const amount = Number.parseFloat(order.total || '0');
          if (Number.isFinite(amount)) {
            if (order.currency === 'USD') acc.usd += amount;
            if (order.currency === 'KHR') acc.khr += amount;
          }
          return acc;
        },
        { usd: 0, khr: 0 },
      );

      return {
        totalRevenue: totals,
        orderCount: filteredOrders.length,
        lowStockCount: lowStockResult.total ?? lowStockResult.items.length,
      };
    },
  });

  return {
    metrics: data ?? null,
    dateRange,
    setDateRange,
    isLoading,
    error: error instanceof Error ? error.message : null,
    refetch: () => refetch(),
  };
}
