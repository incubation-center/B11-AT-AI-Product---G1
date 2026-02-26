import { Hono } from "hono";
import type { Context } from "hono";
import { auth } from "../auth/config";
import { uploadProductImageToCloudinary } from "../lib/cloudinary";
import { requireBearer } from "../middleware/require-bearer";
import { getMyTenant } from "../services/tenant.service";
import {
  answerProductDraft,
  confirmProductDraft,
  getProductDraftById,
  listActiveProductDrafts,
  startProductDraft,
} from "../services/product-draft.service";
import {
  appendProductImageUrl,
  createProduct,
  createVariant,
  deactivateProduct,
  deactivateVariant,
  getProductImageCount,
  getProductById,
  getPublicProductBySubdomain,
  listProducts,
  listPublicProductsBySubdomain,
  updateProduct,
  updateProductStock,
  updateVariant,
  updateVariantStock,
} from "../services/product.service";

function cleanText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : null;
}

function cleanSubdomain(raw: string): string {
  return raw.trim().toLowerCase();
}

function toInteger(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const trimmed = value.trim();
    if (!/^-?\d+$/.test(trimmed)) return null;
    const parsed = Number.parseInt(trimmed, 10);
    return Number.isInteger(parsed) ? parsed : null;
  }
  return null;
}

function toNumericString(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return value.trim();
  }
  return null;
}

async function getSessionUser(c: Context) {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });
  return session?.user ?? null;
}

async function resolveTenant(c: Context): Promise<{ tenantId: string | null; response: Response | null }> {
  const sessionUser = await getSessionUser(c);
  if (!sessionUser) return { tenantId: null, response: c.json({ message: "Unauthorized" }, 401) };

  const tenant = await getMyTenant(sessionUser);
  if (!tenant) return { tenantId: null, response: c.json({ message: "Tenant not found" }, 404) };

  return { tenantId: tenant.id, response: null };
}

export const productRoutes = new Hono();

productRoutes.post("/products/ai/start", requireBearer, async (c) => {
  const resolved = await resolveTenant(c);
  if (resolved.response) return resolved.response;
  const tenantId = resolved.tenantId!;

  const body = await c.req.json().catch(() => null);
  const name = cleanText(body?.name);
  if (!name) return c.json({ message: "name is required" }, 400);

  const basePriceUsd = toNumericString(body?.base_price_usd);
  const basePriceKhr = toNumericString(body?.base_price_khr);
  if (!basePriceUsd) return c.json({ message: "base_price_usd is required and must be a number" }, 400);
  if (!basePriceKhr) return c.json({ message: "base_price_khr is required and must be a number" }, 400);

  try {
    const result = await startProductDraft(tenantId, {
      lang: body?.lang,
      name,
      base_price_usd: basePriceUsd,
      base_price_khr: basePriceKhr,
      category: body?.category,
    });

    return c.json(
      {
        message: "Draft started",
        draft: result.draft,
        next_question: result.nextQuestion,
      },
      201
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start AI draft";
    return c.json({ message }, 400);
  }
});

productRoutes.post("/products/ai/answer", requireBearer, async (c) => {
  const resolved = await resolveTenant(c);
  if (resolved.response) return resolved.response;
  const tenantId = resolved.tenantId!;

  const body = await c.req.json().catch(() => null);
  const draftId = cleanText(body?.draft_id);
  const answer = cleanText(body?.answer);
  if (!draftId) return c.json({ message: "draft_id is required" }, 400);
  if (!answer) return c.json({ message: "answer is required" }, 400);

  try {
    const result = await answerProductDraft(tenantId, {
      draftId,
      answer,
    });

    if (result.message) {
      const status = result.message === "Draft not found" ? 404 : 400;
      return c.json({ message: result.message }, status);
    }

    return c.json({
      message: result.nextQuestion ? "Next question generated" : "Draft is ready to confirm",
      draft: result.draft,
      next_question: result.nextQuestion,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to answer AI draft";
    return c.json({ message }, 400);
  }
});

productRoutes.post("/products/ai/confirm", requireBearer, async (c) => {
  const resolved = await resolveTenant(c);
  if (resolved.response) return resolved.response;
  const tenantId = resolved.tenantId!;

  const body = await c.req.json().catch(() => null);
  const draftId = cleanText(body?.draft_id);
  if (!draftId) return c.json({ message: "draft_id is required" }, 400);

  const result = await confirmProductDraft(tenantId, { draftId });
  if (result.error) {
    const status =
      result.error === "Draft not found" ? 404 : result.error === "Unable to create product" ? 500 : 400;
    return c.json({ message: result.error }, status);
  }

  return c.json({
    message: "Draft confirmed and product created",
    product: result.product,
    variants: result.variants,
    index: result.index,
  });
});

productRoutes.get("/products/ai/drafts", requireBearer, async (c) => {
  const resolved = await resolveTenant(c);
  if (resolved.response) return resolved.response;
  const tenantId = resolved.tenantId!;

  const drafts = await listActiveProductDrafts(tenantId);
  return c.json({ drafts });
});

productRoutes.get("/products/ai/drafts/:id", requireBearer, async (c) => {
  const resolved = await resolveTenant(c);
  if (resolved.response) return resolved.response;
  const tenantId = resolved.tenantId!;

  const draftId = cleanText(c.req.param("id"));
  if (!draftId) return c.json({ message: "draft id is required" }, 400);

  const draft = await getProductDraftById(tenantId, draftId);
  if (!draft) return c.json({ message: "Draft not found" }, 404);

  return c.json({ draft });
});

productRoutes.get("/store/by-subdomain/:subdomain/products", async (c) => {
  const subdomain = cleanSubdomain(c.req.param("subdomain"));
  if (!subdomain) return c.json({ message: "subdomain is required" }, 400);

  const page = toInteger(c.req.query("page"));
  const pageSize = toInteger(c.req.query("page_size"));

  const result = await listPublicProductsBySubdomain(subdomain, {
    q: c.req.query("q") ?? "",
    page: page ?? 1,
    pageSize: pageSize ?? 20,
  });

  if (!result) return c.json({ message: "Store not found" }, 404);

  return c.json({
    store: {
      subdomain: result.tenant.subdomain,
      shop_name: result.tenant.shopName,
    },
    products: result.data,
    pagination: result.pagination,
  });
});

productRoutes.get("/store/by-subdomain/:subdomain/products/:id", async (c) => {
  const subdomain = cleanSubdomain(c.req.param("subdomain"));
  if (!subdomain) return c.json({ message: "subdomain is required" }, 400);

  const productId = cleanText(c.req.param("id"));
  if (!productId) return c.json({ message: "product id is required" }, 400);

  const result = await getPublicProductBySubdomain(subdomain, productId);
  if (!result) return c.json({ message: "Product not found" }, 404);

  return c.json({
    store: {
      subdomain: result.tenant.subdomain,
      shop_name: result.tenant.shopName,
    },
    product: result.product,
  });
});

productRoutes.post("/products", requireBearer, async (c) => {
  const resolved = await resolveTenant(c);
  if (resolved.response) return resolved.response;
  const tenantId = resolved.tenantId!;

  const body = await c.req.json().catch(() => null);
  const name = cleanText(body?.name);
  if (!name) return c.json({ message: "name is required" }, 400);

  const basePriceUsd = body?.base_price_usd !== undefined ? toNumericString(body.base_price_usd) : undefined;
  const basePriceKhr = body?.base_price_khr !== undefined ? toNumericString(body.base_price_khr) : undefined;
  if (body?.base_price_usd !== undefined && !basePriceUsd) {
    return c.json({ message: "base_price_usd must be a number" }, 400);
  }
  if (body?.base_price_khr !== undefined && !basePriceKhr) {
    return c.json({ message: "base_price_khr must be a number" }, 400);
  }

  const stockQty = body?.stock_qty !== undefined ? toInteger(body.stock_qty) : undefined;
  const lowStockThreshold = body?.low_stock_threshold !== undefined ? toInteger(body.low_stock_threshold) : undefined;
  if (body?.stock_qty !== undefined && stockQty === null) {
    return c.json({ message: "stock_qty must be an integer" }, 400);
  }
  if (body?.low_stock_threshold !== undefined && lowStockThreshold === null) {
    return c.json({ message: "low_stock_threshold must be an integer" }, 400);
  }

  const imageUrls = Array.isArray(body?.image_urls)
    ? body.image_urls.filter((v: unknown): v is string => typeof v === "string")
    : undefined;

  const product = await createProduct(tenantId, {
    name,
    description: body?.description,
    category: body?.category,
    basePriceUsd: basePriceUsd ?? undefined,
    basePriceKhr: basePriceKhr ?? undefined,
    trackInventory: typeof body?.track_inventory === "boolean" ? body.track_inventory : undefined,
    stockQty: stockQty ?? undefined,
    lowStockThreshold: lowStockThreshold ?? undefined,
    hasVariants: typeof body?.has_variants === "boolean" ? body.has_variants : undefined,
    imageUrls,
  });

  return c.json({ message: "Product created", product }, 201);
});

productRoutes.get("/products", requireBearer, async (c) => {
  const resolved = await resolveTenant(c);
  if (resolved.response) return resolved.response;
  const tenantId = resolved.tenantId!;

  const page = toInteger(c.req.query("page"));
  const pageSize = toInteger(c.req.query("page_size"));
  const includeInactive = c.req.query("include_inactive") === "true";

  const result = await listProducts(tenantId, {
    q: c.req.query("q") ?? "",
    page: page ?? 1,
    pageSize: pageSize ?? 20,
    includeInactive,
  });

  return c.json(result);
});

productRoutes.get("/products/:id", requireBearer, async (c) => {
  const resolved = await resolveTenant(c);
  if (resolved.response) return resolved.response;
  const tenantId = resolved.tenantId!;

  const productId = cleanText(c.req.param("id"));
  if (!productId) return c.json({ message: "product id is required" }, 400);

  const product = await getProductById(tenantId, productId);
  if (!product) return c.json({ message: "Product not found" }, 404);

  return c.json({ product });
});

productRoutes.patch("/products/:id", requireBearer, async (c) => {
  const resolved = await resolveTenant(c);
  if (resolved.response) return resolved.response;
  const tenantId = resolved.tenantId!;

  const productId = cleanText(c.req.param("id"));
  if (!productId) return c.json({ message: "product id is required" }, 400);

  const body = await c.req.json().catch(() => null);

  const basePriceUsd = body?.base_price_usd !== undefined ? toNumericString(body.base_price_usd) : undefined;
  const basePriceKhr = body?.base_price_khr !== undefined ? toNumericString(body.base_price_khr) : undefined;
  if (body?.base_price_usd !== undefined && !basePriceUsd) {
    return c.json({ message: "base_price_usd must be a number" }, 400);
  }
  if (body?.base_price_khr !== undefined && !basePriceKhr) {
    return c.json({ message: "base_price_khr must be a number" }, 400);
  }

  const stockQty = body?.stock_qty !== undefined ? toInteger(body.stock_qty) : undefined;
  const lowStockThreshold = body?.low_stock_threshold !== undefined ? toInteger(body.low_stock_threshold) : undefined;
  if (body?.stock_qty !== undefined && stockQty === null) {
    return c.json({ message: "stock_qty must be an integer" }, 400);
  }
  if (body?.low_stock_threshold !== undefined && lowStockThreshold === null) {
    return c.json({ message: "low_stock_threshold must be an integer" }, 400);
  }

  const imageUrls = Array.isArray(body?.image_urls)
    ? body.image_urls.filter((v: unknown): v is string => typeof v === "string")
    : undefined;

  const product = await updateProduct(tenantId, productId, {
    name: body?.name,
    description: body?.description,
    category: body?.category,
    basePriceUsd: basePriceUsd ?? undefined,
    basePriceKhr: basePriceKhr ?? undefined,
    trackInventory: typeof body?.track_inventory === "boolean" ? body.track_inventory : undefined,
    stockQty: stockQty ?? undefined,
    lowStockThreshold: lowStockThreshold ?? undefined,
    hasVariants: typeof body?.has_variants === "boolean" ? body.has_variants : undefined,
    imageUrls,
    isActive: typeof body?.is_active === "boolean" ? body.is_active : undefined,
  });

  if (!product) return c.json({ message: "Product not found" }, 404);
  return c.json({ message: "Product updated", product });
});

productRoutes.patch("/products/:id/deactivate", requireBearer, async (c) => {
  const resolved = await resolveTenant(c);
  if (resolved.response) return resolved.response;
  const tenantId = resolved.tenantId!;

  const productId = cleanText(c.req.param("id"));
  if (!productId) return c.json({ message: "product id is required" }, 400);

  const product = await deactivateProduct(tenantId, productId);
  if (!product) return c.json({ message: "Product not found" }, 404);

  return c.json({ message: "Product deactivated", product });
});

productRoutes.patch("/products/:id/stock", requireBearer, async (c) => {
  const resolved = await resolveTenant(c);
  if (resolved.response) return resolved.response;
  const tenantId = resolved.tenantId!;

  const productId = cleanText(c.req.param("id"));
  if (!productId) return c.json({ message: "product id is required" }, 400);

  const body = await c.req.json().catch(() => null);
  const stockQty = toInteger(body?.stock_qty);
  if (stockQty === null) return c.json({ message: "stock_qty must be an integer" }, 400);

  const product = await updateProductStock(tenantId, productId, stockQty);
  if (!product) return c.json({ message: "Product not found" }, 404);

  return c.json({ message: "Product stock updated", product });
});

productRoutes.post("/products/:id/variants", requireBearer, async (c) => {
  const resolved = await resolveTenant(c);
  if (resolved.response) return resolved.response;
  const tenantId = resolved.tenantId!;

  const productId = cleanText(c.req.param("id"));
  if (!productId) return c.json({ message: "product id is required" }, 400);

  const body = await c.req.json().catch(() => null);
  const priceUsd = body?.price_usd !== undefined ? toNumericString(body.price_usd) : undefined;
  const priceKhr = body?.price_khr !== undefined ? toNumericString(body.price_khr) : undefined;
  if (body?.price_usd !== undefined && !priceUsd) {
    return c.json({ message: "price_usd must be a number" }, 400);
  }
  if (body?.price_khr !== undefined && !priceKhr) {
    return c.json({ message: "price_khr must be a number" }, 400);
  }

  const stockQty = body?.stock_qty !== undefined ? toInteger(body.stock_qty) : undefined;
  const lowStockThreshold = body?.low_stock_threshold !== undefined ? toInteger(body.low_stock_threshold) : undefined;
  if (body?.stock_qty !== undefined && stockQty === null) {
    return c.json({ message: "stock_qty must be an integer" }, 400);
  }
  if (body?.low_stock_threshold !== undefined && lowStockThreshold === null) {
    return c.json({ message: "low_stock_threshold must be an integer" }, 400);
  }

  try {
    const variant = await createVariant(tenantId, productId, {
      size: body?.size,
      color: body?.color,
      priceUsd: priceUsd ?? undefined,
      priceKhr: priceKhr ?? undefined,
      stockQty: stockQty ?? undefined,
      lowStockThreshold: lowStockThreshold ?? undefined,
      isActive: typeof body?.is_active === "boolean" ? body.is_active : undefined,
    });

    if (!variant) return c.json({ message: "Product not found" }, 404);
    return c.json({ message: "Variant created", variant }, 201);
  } catch (error: any) {
    if (error?.code === "23505") {
      return c.json({ message: "Variant already exists for this product" }, 409);
    }
    throw error;
  }
});

productRoutes.patch("/variants/:id", requireBearer, async (c) => {
  const resolved = await resolveTenant(c);
  if (resolved.response) return resolved.response;
  const tenantId = resolved.tenantId!;

  const variantId = cleanText(c.req.param("id"));
  if (!variantId) return c.json({ message: "variant id is required" }, 400);

  const body = await c.req.json().catch(() => null);
  const priceUsd = body?.price_usd !== undefined ? toNumericString(body.price_usd) : undefined;
  const priceKhr = body?.price_khr !== undefined ? toNumericString(body.price_khr) : undefined;
  if (body?.price_usd !== undefined && !priceUsd) {
    return c.json({ message: "price_usd must be a number" }, 400);
  }
  if (body?.price_khr !== undefined && !priceKhr) {
    return c.json({ message: "price_khr must be a number" }, 400);
  }

  const stockQty = body?.stock_qty !== undefined ? toInteger(body.stock_qty) : undefined;
  const lowStockThreshold = body?.low_stock_threshold !== undefined ? toInteger(body.low_stock_threshold) : undefined;
  if (body?.stock_qty !== undefined && stockQty === null) {
    return c.json({ message: "stock_qty must be an integer" }, 400);
  }
  if (body?.low_stock_threshold !== undefined && lowStockThreshold === null) {
    return c.json({ message: "low_stock_threshold must be an integer" }, 400);
  }

  try {
    const variant = await updateVariant(tenantId, variantId, {
      size: body?.size,
      color: body?.color,
      priceUsd: priceUsd ?? undefined,
      priceKhr: priceKhr ?? undefined,
      stockQty: stockQty ?? undefined,
      lowStockThreshold: lowStockThreshold ?? undefined,
      isActive: typeof body?.is_active === "boolean" ? body.is_active : undefined,
    });

    if (!variant) return c.json({ message: "Variant not found" }, 404);
    return c.json({ message: "Variant updated", variant });
  } catch (error: any) {
    if (error?.code === "23505") {
      return c.json({ message: "Variant already exists for this product" }, 409);
    }
    throw error;
  }
});

productRoutes.patch("/variants/:id/stock", requireBearer, async (c) => {
  const resolved = await resolveTenant(c);
  if (resolved.response) return resolved.response;
  const tenantId = resolved.tenantId!;

  const variantId = cleanText(c.req.param("id"));
  if (!variantId) return c.json({ message: "variant id is required" }, 400);

  const body = await c.req.json().catch(() => null);
  const stockQty = toInteger(body?.stock_qty);
  if (stockQty === null) return c.json({ message: "stock_qty must be an integer" }, 400);

  const variant = await updateVariantStock(tenantId, variantId, stockQty);
  if (!variant) return c.json({ message: "Variant not found" }, 404);

  return c.json({ message: "Variant stock updated", variant });
});

productRoutes.patch("/variants/:id/deactivate", requireBearer, async (c) => {
  const resolved = await resolveTenant(c);
  if (resolved.response) return resolved.response;
  const tenantId = resolved.tenantId!;

  const variantId = cleanText(c.req.param("id"));
  if (!variantId) return c.json({ message: "variant id is required" }, 400);

  const variant = await deactivateVariant(tenantId, variantId);
  if (!variant) return c.json({ message: "Variant not found" }, 404);

  return c.json({ message: "Variant deactivated", variant });
});

productRoutes.post("/products/:id/images", requireBearer, async (c) => {
  const resolved = await resolveTenant(c);
  if (resolved.response) return resolved.response;
  const tenantId = resolved.tenantId!;

  const productId = cleanText(c.req.param("id"));
  if (!productId) return c.json({ message: "product id is required" }, 400);

  const form = await c.req.formData().catch(() => null);
  const file = form?.get("file");

  if (!(file instanceof File)) {
    return c.json({ message: "file is required" }, 400);
  }
  if (file.size <= 0) {
    return c.json({ message: "file is empty" }, 400);
  }

  try {
    const imageCount = await getProductImageCount(tenantId, productId);
    if (imageCount === null) return c.json({ message: "Product not found" }, 404);
    if (imageCount >= 3) {
      return c.json({ message: "Maximum 3 images allowed per product" }, 400);
    }

    const upload = await uploadProductImageToCloudinary({
      file,
      tenantId,
      productId,
    });
    const product = await appendProductImageUrl(tenantId, productId, upload.publicUrl);
    if (!product) return c.json({ message: "Product not found" }, 404);

    return c.json({
      message: "Image uploaded",
      upload,
      image_urls: product.imageUrls,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "IMAGE_LIMIT_REACHED") {
      return c.json({ message: "Maximum 3 images allowed per product" }, 400);
    }
    const message = error instanceof Error ? error.message : "Unable to upload image";
    return c.json({ message }, 400);
  }
});
