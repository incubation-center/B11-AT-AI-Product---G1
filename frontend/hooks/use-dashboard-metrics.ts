"use client";

import { useState, useEffect, useCallback } from "react";
import { inventoryApi, ordersApi } from "@/lib/orders";
import type { DashboardMetrics } from "@/types/orders";

export type DateRangeFilter = "daily" | "weekly" | "monthly";

export interface UseDashboardMetricsReturn {
  metrics: DashboardMetrics | null;
  dateRange: DateRangeFilter;
  setDateRange: (range: DateRangeFilter) => void;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDashboardMetrics(): UseDashboardMetricsReturn {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [dateRange, setDateRange] = useState<DateRangeFilter>("weekly");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [ordersResult, lowStockResult] = await Promise.all([
        ordersApi.getAll(),
        inventoryApi.getLowStockItems(),
      ]);

      const now = new Date();
      const filteredOrders = (ordersResult?.orders ?? []).filter((order) => {
        const createdAt = new Date(order.created_at);
        if (dateRange === "daily") {
          return now.getTime() - createdAt.getTime() <= 24 * 60 * 60 * 1000;
        }
        if (dateRange === "weekly") {
          return now.getTime() - createdAt.getTime() <= 7 * 24 * 60 * 60 * 1000;
        }
        return now.getTime() - createdAt.getTime() <= 30 * 24 * 60 * 60 * 1000;
      });

      const totals = filteredOrders.reduce(
        (acc, order) => {
          const amount = Number.parseFloat(order.total || "0");
          if (Number.isFinite(amount)) {
            if (order.currency === "USD") acc.usd += amount;
            if (order.currency === "KHR") acc.khr += amount;
          }
          return acc;
        },
        { usd: 0, khr: 0 }
      );

      setMetrics({
        totalRevenue: totals,
        orderCount: filteredOrders.length,
        lowStockCount: lowStockResult.total ?? lowStockResult.items.length,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load metrics");
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    load();
  }, [load]);

  return { metrics, dateRange, setDateRange, isLoading, error, refetch: load };
}
