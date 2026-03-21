"use client";

import { useState, useEffect, useCallback } from "react";
import { ordersApi } from "@/lib/orders";
import type { Order } from "@/types/orders";

export interface UseDashboardOrdersReturn {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDashboardOrders(): UseDashboardOrdersReturn {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await ordersApi.getAll();
      setOrders(res?.orders ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { orders, isLoading, error, refetch: load };
}
