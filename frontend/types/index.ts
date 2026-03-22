// Product & Variant Types
export type {
  Product,
  ProductVariant,
  CreateProductPayload,
  UpdateProductPayload,
  CreateVariantPayload,
  UpdateVariantPayload,
  LowStockItem,
  ProductDraft,
  StartDraftPayload,
  AnswerDraftPayload,
  ConfirmDraftPayload,
  AiDraftResponse,
  AiConfirmResponse,
  ProductsListResponse,
} from '@/lib/products';

// Order Types
export type {
  Order,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  OrderItem,
  Payment,
  LowStockItem as OrderLowStockItem,
  LowStockResponse,
  DashboardMetrics,
} from './orders';
