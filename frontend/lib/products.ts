import { protectedFetch } from './auth';

// --- Types ---

export type ProductVariant = {
  id: string;
  product_id: string;
  variant_name: string | null;
  size: string | null;
  color: string | null;
  price_override_usd: string | null;
  price_override_khr: string | null;
  stock_qty: number;
  low_stock_threshold: number;
  is_active: boolean;
  image_url?: string | null;
  sku?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type Product = {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  base_price_usd: string | null;
  base_price_khr: string | null;
  image_urls: string[];
  category: string | null;
  has_variants: boolean;
  track_inventory: boolean;
  stock_qty: number;
  low_stock_threshold: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  variants?: ProductVariant[];
};

export type CreateProductPayload = {
  name: string;
  description?: string;
  base_price_usd?: string | number;
  base_price_khr?: string | number;
  category?: string;
  has_variants?: boolean;
  track_inventory?: boolean;
  stock_qty?: number;
  low_stock_threshold?: number;
  image_urls?: string[];
};

export type UpdateProductPayload = Partial<CreateProductPayload> & {
  is_active?: boolean;
};

export type CreateVariantPayload = {
  variant_name?: string;
  size?: string;
  color?: string;
  price_override_usd?: string | number | null;
  price_override_khr?: string | number | null;
  stock_qty?: number;
  low_stock_threshold?: number;
  sku?: string;
  image_url?: string;
  is_active?: boolean;
};

export type UpdateVariantPayload = Partial<CreateVariantPayload>;

export type LowStockItem = {
  type: 'product' | 'variant';
  id: string;
  name: string;
  current_stock: number;
  threshold: number;
  product_id?: string; // if type is variant
  product_name?: string; // if type is variant
};

export type ProductDraft = {
  id: string;
  tenant_id: string;
  product_id: string | null;
  status: 'in_progress' | 'completed' | 'cancelled';
  current_step: number;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type StartDraftPayload = {
  lang?: string;
  product_id?: string; // For revising existing product
  name?: string;
  description?: string;
  base_price_usd?: string | number;
  base_price_khr?: string | number;
  category?: string;
  has_variants?: boolean;
  track_inventory?: boolean;
  stock_qty?: number;
  low_stock_threshold?: number;
  variants?: unknown[];
};

export type AnswerDraftPayload = {
  draft_id: string;
  answer: string;
};

export type ConfirmDraftPayload = {
  draft_id: string;
};

export type AiDraftResponse = {
  message: string;
  draft: ProductDraft;
  next_question: string | null;
};

export type AiConfirmResponse = {
  message: string;
  product: Product;
  variants: ProductVariant[];
  index: unknown;
};

export type ProductsListResponse = {
  data: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type BackendProduct = {
  id: string;
  tenantId?: string;
  tenant_id?: string;
  name: string;
  description: string | null;
  basePriceUsd?: string | null;
  base_price_usd?: string | null;
  basePriceKhr?: string | null;
  base_price_khr?: string | null;
  imageUrls?: string[];
  image_urls?: string[];
  category: string | null;
  hasVariants?: boolean;
  has_variants?: boolean;
  trackInventory?: boolean;
  track_inventory?: boolean;
  stockQty?: number;
  stock_qty?: number;
  lowStockThreshold?: number;
  low_stock_threshold?: number;
  isActive?: boolean;
  is_active?: boolean;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  variants?: ProductVariant[];
};

type BackendProductsListResponse = {
  data: BackendProduct[];
  pagination?: {
    total?: number;
    page?: number;
    pageSize?: number;
    totalPages?: number;
  };
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
};

function normalizeProduct(product: BackendProduct): Product {
  return {
    id: product.id,
    tenant_id: product.tenant_id ?? product.tenantId ?? '',
    name: product.name,
    description: product.description ?? null,
    base_price_usd: product.base_price_usd ?? product.basePriceUsd ?? null,
    base_price_khr: product.base_price_khr ?? product.basePriceKhr ?? null,
    image_urls: product.image_urls ?? product.imageUrls ?? [],
    category: product.category ?? null,
    has_variants: product.has_variants ?? product.hasVariants ?? false,
    track_inventory: product.track_inventory ?? product.trackInventory ?? true,
    stock_qty: product.stock_qty ?? product.stockQty ?? 0,
    low_stock_threshold:
      product.low_stock_threshold ?? product.lowStockThreshold ?? 5,
    is_active: product.is_active ?? product.isActive ?? true,
    created_at: product.created_at ?? product.createdAt ?? '',
    updated_at: product.updated_at ?? product.updatedAt ?? '',
    variants: product.variants,
  };
}

// --- HTTP Helpers ---

// Products CRUD

export async function listProducts(params?: {
  q?: string;
  page?: number;
  page_size?: number;
  include_inactive?: boolean;
}) {
  const searchParams = new URLSearchParams();
  if (params?.q) searchParams.set('q', params.q);
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.page_size)
    searchParams.set('page_size', String(params.page_size));
  if (params?.include_inactive) searchParams.set('include_inactive', 'true');

  const response = await protectedFetch<BackendProductsListResponse>(
    `/products?${searchParams.toString()}`,
  );

  const pagination = response.pagination ?? {};

  return {
    data: (response.data ?? []).map(normalizeProduct),
    total: response.total ?? pagination.total ?? 0,
    page: response.page ?? pagination.page ?? 1,
    pageSize:
      response.pageSize ?? pagination.pageSize ?? params?.page_size ?? 20,
    totalPages: response.totalPages ?? pagination.totalPages ?? 1,
  } satisfies ProductsListResponse;
}

export async function getProduct(id: string) {
  const response = await protectedFetch<{ product: BackendProduct }>(
    `/products/${id}`,
  );
  return { product: normalizeProduct(response.product) };
}

export async function createProduct(payload: CreateProductPayload) {
  const response = await protectedFetch<{
    message: string;
    product: BackendProduct;
  }>(`/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return { ...response, product: normalizeProduct(response.product) };
}

export async function updateProduct(id: string, payload: UpdateProductPayload) {
  const response = await protectedFetch<{
    message: string;
    product: BackendProduct;
  }>(`/products/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return { ...response, product: normalizeProduct(response.product) };
}

export async function deactivateProduct(id: string) {
  const response = await protectedFetch<{
    message: string;
    product: BackendProduct;
  }>(`/products/${id}/deactivate`, {
    method: 'PATCH',
  });

  return { ...response, product: normalizeProduct(response.product) };
}

export async function uploadProductImage(id: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);

  return protectedFetch<{
    message: string;
    upload: unknown;
    image_urls: string[];
  }>(`/products/${id}/images`, {
    method: 'POST',
    body: formData,
    // Note: we don't set Content-Type header so the browser sets the boundary automatically
  });
}

export async function updateProductStock(id: string, qty: number) {
  const response = await protectedFetch<{
    message: string;
    product: BackendProduct;
  }>(`/products/${id}/stock`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stock_qty: qty }),
  });

  return { ...response, product: normalizeProduct(response.product) };
}

export async function syncProductToRag(id: string) {
  return protectedFetch<{ message: string }>(`/rag/index/product/${id}`, {
    method: 'POST',
  });
}

// Variants CRUD

export async function createVariant(
  productId: string,
  payload: CreateVariantPayload,
) {
  return protectedFetch<{ message: string; variant: ProductVariant }>(
    `/products/${productId}/variants`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  );
}

export async function updateVariant(id: string, payload: UpdateVariantPayload) {
  return protectedFetch<{ message: string; variant: ProductVariant }>(
    `/variants/${id}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  );
}

export async function deactivateVariant(id: string) {
  return protectedFetch<{ message: string; variant: ProductVariant }>(
    `/variants/${id}/deactivate`,
    {
      method: 'PATCH',
    },
  );
}

export async function updateVariantStock(id: string, qty: number) {
  return protectedFetch<{ message: string; variant: ProductVariant }>(
    `/variants/${id}/stock`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock_qty: qty }),
    },
  );
}

// Inventory

export async function listLowStockItems() {
  return protectedFetch<{ items: LowStockItem[]; total: number }>(
    `/inventory/low-stock`,
  );
}

// AI Drafts

export async function startProductDraft(payload: StartDraftPayload) {
  return protectedFetch<AiDraftResponse>(`/products/ai/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function answerProductDraft(payload: AnswerDraftPayload) {
  return protectedFetch<AiDraftResponse>(`/products/ai/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function confirmProductDraft(payload: ConfirmDraftPayload) {
  return protectedFetch<AiConfirmResponse>(`/products/ai/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function listActiveDrafts() {
  return protectedFetch<{ drafts: ProductDraft[] }>(`/products/ai/drafts`);
}

export async function getDraft(id: string) {
  return protectedFetch<{ draft: ProductDraft }>(`/products/ai/drafts/${id}`);
}
