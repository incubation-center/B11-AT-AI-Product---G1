"use client";

import { useState, useEffect, useCallback } from "react";
import { inventoryApi } from "@/lib/orders";
import type { LowStockItem } from "@/types/orders";

export interface UseLowStockItemsReturn {
  items: LowStockItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useLowStockItems(): UseLowStockItemsReturn {
  const [items, setItems] = useState<LowStockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await inventoryApi.getLowStockItems();
      setItems(res.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load low stock items");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { items, isLoading, error, refetch: load };
}
