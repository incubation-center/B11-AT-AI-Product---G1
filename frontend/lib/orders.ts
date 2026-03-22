import { protectedFetch } from './auth';
import type { Order, LowStockResponse } from '@/types/orders';

type BackendLowStockItem = {
  level?: 'product' | 'variant';
  tenant_id?: string;
  tenantId?: string;
  product_id?: string;
  productId?: string;
  product_name?: string;
  productName?: string;
  variant_id?: string | null;
  variantId?: string | null;
  variant_label?: string | null;
  variantLabel?: string | null;
  stock_qty?: number;
  stockQty?: number;
  low_stock_threshold?: number;
  lowStockThreshold?: number;
};

type BackendLowStockResponse = {
  items: BackendLowStockItem[];
  total: number;
};

export const ordersApi = {
  getAll: () => protectedFetch<{ orders: Order[] }>('/orders'),

  getById: (id: string) =>
    protectedFetch<Order & { items: unknown[]; payments: unknown[] }>(
      `/orders/${id}`,
    ),

  updateStatus: (id: string, status: string) =>
    protectedFetch<Order>(`/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }),

  updatePaymentStatus: (id: string, payment_status: string) =>
    protectedFetch<Order>(`/orders/${id}/payment`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_status }),
    }),
};

export const inventoryApi = {
  getLowStockItems: async (): Promise<LowStockResponse> => {
    const response = await protectedFetch<BackendLowStockResponse>(
      '/inventory/low-stock',
    );

    return {
      items: (response.items ?? []).map((item) => ({
        level: item.level ?? 'product',
        tenant_id: item.tenant_id ?? item.tenantId ?? '',
        product_id: item.product_id ?? item.productId ?? '',
        product_name:
          item.product_name ?? item.productName ?? 'Unnamed product',
        variant_id: item.variant_id ?? item.variantId ?? null,
        variant_label: item.variant_label ?? item.variantLabel ?? null,
        stock_qty: item.stock_qty ?? item.stockQty ?? 0,
        low_stock_threshold:
          item.low_stock_threshold ?? item.lowStockThreshold ?? 0,
      })),
      total: response.total ?? 0,
    };
  },
};
