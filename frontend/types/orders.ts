export type OrderStatus = "pending" | "confirmed" | "delivering" | "completed" | "cancelled";
export type PaymentStatus = "unpaid" | "paid" | "refunded";
export type PaymentMethod = "cod" | "aba_transfer";

export interface OrderItem {
  id: string;
  order_id: string;
  tenant_id: string;
  product_id: string;
  product_name_snapshot: string;
  variant_id: string | null;
  variant_snapshot: Record<string, unknown> | null;
  qty: number;
  price_snapshot: string;
  line_total: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  tenant_id: string;
  method: PaymentMethod;
  amount: string;
  reference: string | null;
  status: "confirmed" | "failed";
  paid_at: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  order_no: string;
  tenant_id: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  customer_name: string;
  customer_phone: string | null;
  address_text: string;
  google_map_url: string | null;
  currency: "USD" | "KHR";
  total: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  payments?: Payment[];
}

export interface LowStockItem {
  level: "product" | "variant";
  tenant_id: string;
  product_id: string;
  product_name: string;
  variant_id: string | null;
  variant_label: string | null;
  stock_qty: number;
  low_stock_threshold: number;
}

export interface LowStockResponse {
  items: LowStockItem[];
  total: number;
}

export interface DashboardMetrics {
  totalRevenue: {
    usd: number;
    khr: number;
  };
  orderCount: number;
  lowStockCount: number;
}
