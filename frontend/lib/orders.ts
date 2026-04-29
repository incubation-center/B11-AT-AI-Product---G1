import { protectedFetch } from './auth';
import type { Order, LowStockResponse } from '@/types/orders';

type BackendOrderItem = {
  id: string;
  order_id?: string;
  orderId?: string;
  tenant_id?: string;
  tenantId?: string;
  product_id?: string;
  productId?: string;
  product_name_snapshot?: string;
  productNameSnapshot?: string;
  variant_id?: string | null;
  variantId?: string | null;
  variant_snapshot?: Record<string, unknown> | null;
  variantSnapshot?: Record<string, unknown> | null;
  qty?: number;
  price_snapshot?: string;
  priceSnapshot?: string;
  line_total?: string;
  lineTotal?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
};

type BackendPayment = {
  id: string;
  order_id?: string;
  orderId?: string;
  tenant_id?: string;
  tenantId?: string;
  method: 'cod' | 'aba_transfer';
  amount: string;
  reference?: string | null;
  status: 'confirmed' | 'failed';
  paid_at?: string | null;
  paidAt?: string | null;
  created_at?: string;
  createdAt?: string;
};

type BackendOrder = {
  id: string;
  order_no?: string;
  orderNo?: string;
  tenant_id?: string;
  tenantId?: string;
  status: Order['status'];
  payment_status?: Order['payment_status'];
  paymentStatus?: Order['payment_status'];
  payment_method?: Order['payment_method'];
  paymentMethod?: Order['payment_method'];
  customer_name?: string;
  customerName?: string;
  customer_phone?: string | null;
  customerPhone?: string | null;
  address_text?: string;
  addressText?: string;
  google_map_url?: string | null;
  googleMapUrl?: string | null;
  currency: Order['currency'];
  total: string;
  notes?: string | null;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  items?: BackendOrderItem[];
  payments?: BackendPayment[];
};

type OrderItemShape = NonNullable<Order['items']>[number];
type PaymentShape = NonNullable<Order['payments']>[number];
type BackendOrderResponse = BackendOrder | { order?: BackendOrder };

function normalizeOrderItem(item: BackendOrderItem): OrderItemShape {
  return {
    id: item.id,
    order_id: item.order_id ?? item.orderId ?? '',
    tenant_id: item.tenant_id ?? item.tenantId ?? '',
    product_id: item.product_id ?? item.productId ?? '',
    product_name_snapshot:
      item.product_name_snapshot ?? item.productNameSnapshot ?? '',
    variant_id: item.variant_id ?? item.variantId ?? null,
    variant_snapshot: item.variant_snapshot ?? item.variantSnapshot ?? null,
    qty: item.qty ?? 0,
    price_snapshot: item.price_snapshot ?? item.priceSnapshot ?? '0',
    line_total: item.line_total ?? item.lineTotal ?? '0',
    created_at: item.created_at ?? item.createdAt ?? '',
    updated_at: item.updated_at ?? item.updatedAt ?? '',
  };
}

function normalizePayment(payment: BackendPayment): PaymentShape {
  return {
    id: payment.id,
    order_id: payment.order_id ?? payment.orderId ?? '',
    tenant_id: payment.tenant_id ?? payment.tenantId ?? '',
    method: payment.method,
    amount: payment.amount,
    reference: payment.reference ?? null,
    status: payment.status,
    paid_at: payment.paid_at ?? payment.paidAt ?? null,
    created_at: payment.created_at ?? payment.createdAt ?? '',
  };
}

function normalizeOrder(order: BackendOrder): Order {
  return {
    id: order.id,
    order_no: order.order_no ?? order.orderNo ?? '',
    tenant_id: order.tenant_id ?? order.tenantId ?? '',
    status: order.status,
    payment_status: order.payment_status ?? order.paymentStatus ?? 'unpaid',
    payment_method: order.payment_method ?? order.paymentMethod ?? 'cod',
    customer_name: order.customer_name ?? order.customerName ?? 'N/A',
    customer_phone: order.customer_phone ?? order.customerPhone ?? null,
    address_text: order.address_text ?? order.addressText ?? '',
    google_map_url: order.google_map_url ?? order.googleMapUrl ?? null,
    currency: order.currency,
    total: order.total,
    notes: order.notes ?? null,
    created_at: order.created_at ?? order.createdAt ?? '',
    updated_at: order.updated_at ?? order.updatedAt ?? '',
    items: order.items?.map(normalizeOrderItem),
    payments: order.payments?.map(normalizePayment),
  };
}

function unwrapOrderPayload(payload: BackendOrderResponse): BackendOrder {
  if ('order' in payload && payload.order) {
    return payload.order;
  }
  return payload as BackendOrder;
}

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
  getAll: async () => {
    const response = await protectedFetch<{ orders: BackendOrder[] }>(
      '/orders',
    );
    return {
      orders: (response.orders ?? []).map(normalizeOrder),
    };
  },

  getById: async (id: string) => {
    const response = await protectedFetch<BackendOrderResponse>(
      `/orders/${id}`,
    );
    return normalizeOrder(unwrapOrderPayload(response));
  },

  updateStatus: async (id: string, status: string) => {
    const response = await protectedFetch<BackendOrderResponse>(
      `/orders/${id}/status`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      },
    );
    return normalizeOrder(unwrapOrderPayload(response));
  },

  updatePaymentStatus: async (id: string, payment_status: string) => {
    const response = await protectedFetch<BackendOrderResponse>(
      `/orders/${id}/payment`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_status }),
      },
    );
    return normalizeOrder(unwrapOrderPayload(response));
  },

  cancel: async (id: string) => {
    const response = await protectedFetch<BackendOrderResponse>(
      `/orders/${id}/cancel`,
      {
        method: 'POST',
      },
    );
    return normalizeOrder(unwrapOrderPayload(response));
  },
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
