'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@/lib/orders';
import { queryKeys } from '@/lib/query-keys';
import type { Order } from '@/types/orders';

export function useOrders(filters: { status?: string; from?: string; to?: string } = {}) {
  return useQuery({
    queryKey: queryKeys.orderList(filters),
    queryFn: async () => {
      const res = await ordersApi.getAll();
      let orders = res?.orders ?? [];

      // Client-side filtering as backend doesn't support all filters perfectly in README description
      // but service.ts shows it supports status, from, to.
      // We'll trust the backend service.ts logic but provide this hook for the UI.
      
      // If we want to add more client-side filtering (like search by order_no or customer name)
      // we can do it here if needed, but for now we'll just return what backend gives.
      return orders;
    },
  });
}

export function useOrder(id: string | null) {
  return useQuery({
    queryKey: queryKeys.orderDetail(id || ''),
    queryFn: () => (id ? ordersApi.getById(id) : null),
    enabled: !!id,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      ordersApi.updateStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
    },
  });
}

export function useUpdateOrderPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payment_status }: { id: string; payment_status: string }) =>
      ordersApi.updatePaymentStatus(id, payment_status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ordersApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
    },
  });
}
