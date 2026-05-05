import { Hono } from "hono";
import type { Context } from "hono";
import { auth } from "../auth/config";
import { uploadProductImageToCloudinary } from "../lib/cloudinary";
import { requireBearer } from "../middleware/require-bearer";
import { listLowStockItems } from "../services/inventory.service";
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
  countActiveProducts,
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
import { getSubscriptionAccessForTenant } from "../services/subscription.service";

const AI_RATE_LIMIT_WINDOW_MS = 60_000;
const AI_RATE_LIMIT_MAX_REQUESTS = 20;
const SUBSCRIPTION_REQUIRED_MESSAGE = "Subscription is required to use this feature.";
const aiRateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

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

function parseOptionalNumericField(
  body: any,
  fieldName: string
): { value: string | undefined; message: string | null } {
  const rawValue = body?.[fieldName];
  if (rawValue === undefined) return { value: undefined, message: null };

  const parsedValue = toNumericString(rawValue);
  if (!parsedValue) return { value: undefined, message: `${fieldName} must be a number` };

  return { value: parsedValue, message: null };
}

function parseOptionalIntegerField(
  body: any,
  fieldName: string
): { value: number | undefined; message: string | null } {
  const rawValue = body?.[fieldName];
  if (rawValue === undefined) return { value: undefined, message: null };

  const parsedValue = toInteger(rawValue);
  if (parsedValue === null) return { value: undefined, message: `${fieldName} must be an integer` };

  return { value: parsedValue, message: null };
}

function parseOptionalStringArray(body: any, fieldName: string): string[] | undefined {
  if (!Array.isArray(body?.[fieldName])) return undefined;
  return body[fieldName].filter((value: unknown): value is string => typeof value === "string");
}

function validateProductPricingAndInventory(body: any): {
  values?: {
    basePriceUsd: string | undefined;
    basePriceKhr: string | undefined;
    stockQty: number | undefined;
    lowStockThreshold: number | undefined;
  };
  message: string | null;
} {
  const basePriceUsd = parseOptionalNumericField(body, "base_price_usd");
  if (basePriceUsd.message) return { message: basePriceUsd.message };

  const basePriceKhr = parseOptionalNumericField(body, "base_price_khr");
  if (basePriceKhr.message) return { message: basePriceKhr.message };

  const stockQty = parseOptionalIntegerField(body, "stock_qty");
  if (stockQty.message) return { message: stockQty.message };

  const lowStockThreshold = parseOptionalIntegerField(body, "low_stock_threshold");
  if (lowStockThreshold.message) return { message: lowStockThreshold.message };

  return {
    values: {
      basePriceUsd: basePriceUsd.value,
      basePriceKhr: basePriceKhr.value,
      stockQty: stockQty.value,
      lowStockThreshold: lowStockThreshold.value,
    },
    message: null,
  };
}

function validateVariantPricingAndInventory(body: any): {
  values?: {
    priceUsd: string | undefined;
    priceKhr: string | undefined;
    stockQty: number | undefined;
    lowStockThreshold: number | undefined;
  };
  message: string | null;
} {
  const priceUsd = parseOptionalNumericField(body, "price_usd");
  if (priceUsd.message) return { message: priceUsd.message };

  const priceKhr = parseOptionalNumericField(body, "price_khr");
  if (priceKhr.message) return { message: priceKhr.message };

  const stockQty = parseOptionalIntegerField(body, "stock_qty");
  if (stockQty.message) return { message: stockQty.message };

  const lowStockThreshold = parseOptionalIntegerField(body, "low_stock_threshold");
  if (lowStockThreshold.message) return { message: lowStockThreshold.message };

  return {
    values: {
      priceUsd: priceUsd.value,
      priceKhr: priceKhr.value,
      stockQty: stockQty.value,
      lowStockThreshold: lowStockThreshold.value,
    },
    message: null,
  };
}

function getClientIp(c: Context): string {
  const forwardedFor = c.req.header("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  return (
    c.req.header("cf-connecting-ip") ??
    c.req.header("x-real-ip") ??
    c.req.header("x-client-ip") ??
    "unknown"
  );
}

function enforceAiRateLimit(c: Context, tenantId: string, requesterKey: string): Response | null {
  const now = Date.now();
  const bucketKey = `${tenantId}:${requesterKey}`;
  const current = aiRateLimitBuckets.get(bucketKey);

  if (!current || now >= current.resetAt) {
    aiRateLimitBuckets.set(bucketKey, {
      count: 1,
      resetAt: now + AI_RATE_LIMIT_WINDOW_MS,
    });
    return null;
  }

  if (current.count >= AI_RATE_LIMIT_MAX_REQUESTS) {
    const retryAfterSec = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    c.header("Retry-After", String(retryAfterSec));
    return c.json(
      {
        message: "Too many AI requests. Please try again shortly.",
        retry_after_seconds: retryAfterSec,
      },
      429
    );
  }

  current.count += 1;
  aiRateLimitBuckets.set(bucketKey, current);
  return null;
}

async function getSessionUser(c: Context) {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });
  return session?.user ?? null;
}

async function resolveTenant(
  c: Context
): Promise<{ tenantId: string | null; requesterKey: string | null; response: Response | null }> {
  const sessionUser = await getSessionUser(c);
  if (!sessionUser) return { tenantId: null, requesterKey: null, response: c.json({ message: "Unauthorized" }, 401) };

  const tenant = await getMyTenant(sessionUser);
  if (!tenant) return { tenantId: null, requesterKey: null, response: c.json({ message: "Tenant not found" }, 404) };

  const requesterKey = sessionUser.id || getClientIp(c);
  return { tenantId: tenant.id, requesterKey, response: null };
}

async function requireActiveSubscription(c: Context, tenantId: string) {
  const access = await getSubscriptionAccessForTenant(tenantId);
  if (!access.allowed) {
    return {
      access,
      response: c.json({ message: SUBSCRIPTION_REQUIRED_MESSAGE }, 402),
    };
  }

  return { access, response: null };
}

async function requireProductCapacity(c: Context, tenantId: string) {
  const subscription = await requireActiveSubscription(c, tenantId);
  if (subscription.response) return subscription;

  const activeProductCount = await countActiveProducts(tenantId);
  if (activeProductCount >= subscription.access.productLimit) {
    return {
      access: subscription.access,
      response: c.json(
        {
          message: `Your plan allows up to ${subscription.access.productLimit} active products.`,
        },
        402
      ),
    };
  }

  return subscription;
}

function triggerAutoProductAiAnalysis(tenantId: string, productId: string, lang?: unknown) {
  void (async () => {
    try {
      const draftResult = await startProductDraft(tenantId, {
        lang,
        product_id: productId,
      });
      if (draftResult.draft?.id && !draftResult.nextQuestion) {
        await confirmProductDraft(tenantId, { draftId: draftResult.draft.id });
      }
    } catch (error) {
      console.error("[ai] auto product analysis failed", {
        tenantId,
        productId,
        error,
      });
    }
  })();
}

export const productRoutes = new Hono();

productRoutes.get("/inventory/low-stock", requireBearer, async (c) => {
  const resolved = await resolveTenant(c);
  if (resolved.response) return resolved.response;
  const tenantId = resolved.tenantId!;

  const items = await listLowStockItems(tenantId);
  return c.json({
    items: items.map((item) => ({
      level: item.level,
      tenant_id: item.tenantId,
      product_id: item.productId,
      product_name: item.productName,
      variant_id: item.variantId,
      variant_label: item.variantLabel,
      stock_qty: item.stockQty,
      low_stock_threshold: item.lowStockThreshold,
    })),
    total: items.length,
  });
});

productRoutes.post("/products/ai/start", requireBearer, async (c) => {
  const resolved = await resolveTenant(c);
  if (resolved.response) return resolved.response;
  const tenantId = resolved.tenantId!;
  const requesterKey = resolved.requesterKey!;

  const body = await c.req.json().catch(() => null);
  const productId = cleanText(body?.product_id);
  const name = cleanText(body?.name);
  const basePriceUsd = toNumericString(body?.base_price_usd);
  const basePriceKhr = toNumericString(body?.base_price_khr);

  const subscription = productId
    ? await requireActiveSubscription(c, tenantId)
    : await requireProductCapacity(c, tenantId);
  if (subscription.response) return subscription.response;

  const rateLimited = enforceAiRateLimit(c, tenantId, requesterKey);
  if (rateLimited) return rateLimited;

  if (!productId) {
    if (!name) return c.json({ message: "name is required" }, 400);
    if (!basePriceUsd) return c.json({ message: "base_price_usd is required and must be a number" }, 400);
    if (!basePriceKhr) return c.json({ message: "base_price_khr is required and must be a number" }, 400);
  }

  try {
    const result = await startProductDraft(tenantId, {
      lang: body?.lang,
      product_id: productId,
      name: name ?? undefined,
      description: body?.description,
      base_price_usd: basePriceUsd,
      base_price_khr: basePriceKhr,
      category: body?.category,
      has_variants: body?.has_variants,
      track_inventory: body?.track_inventory,
      stock_qty: body?.stock_qty,
      low_stock_threshold: body?.low_stock_threshold,
      variants: body?.variants,
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
  const requesterKey = resolved.requesterKey!;
  const subscription = await requireActiveSubscription(c, tenantId);
  if (subscription.response) return subscription.response;

  const rateLimited = enforceAiRateLimit(c, tenantId, requesterKey);
  if (rateLimited) return rateLimited;

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
  const requesterKey = resolved.requesterKey!;

  const body = await c.req.json().catch(() => null);
  const draftId = cleanText(body?.draft_id);
  if (!draftId) return c.json({ message: "draft_id is required" }, 400);

  const draft = await getProductDraftById(tenantId, draftId);
  if (!draft) return c.json({ message: "Draft not found" }, 404);

  const initialInput = draft.initialInput as Record<string, unknown>;
  const subscription = cleanText(initialInput.product_id)
    ? await requireActiveSubscription(c, tenantId)
    : await requireProductCapacity(c, tenantId);
  if (subscription.response) return subscription.response;

  const rateLimited = enforceAiRateLimit(c, tenantId, requesterKey);
  if (rateLimited) return rateLimited;

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
  const subscription = await requireProductCapacity(c, tenantId);
  if (subscription.response) return subscription.response;

  const body = await c.req.json().catch(() => null);
  const name = cleanText(body?.name);
  if (!name) return c.json({ message: "name is required" }, 400);

  const productValidation = validateProductPricingAndInventory(body);
  if (productValidation.message || !productValidation.values) {
    return c.json({ message: productValidation.message ?? "Invalid product payload" }, 400);
  }

  const { basePriceUsd, basePriceKhr, stockQty, lowStockThreshold } = productValidation.values;
  const imageUrls = parseOptionalStringArray(body, "image_urls");

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

  if (product?.id) {
    triggerAutoProductAiAnalysis(tenantId, product.id, body?.lang);
  }

  return c.json({ message: "Product created. AI analysis started.", product }, 201);
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

  const productValidation = validateProductPricingAndInventory(body);
  if (productValidation.message || !productValidation.values) {
    return c.json({ message: productValidation.message ?? "Invalid product payload" }, 400);
  }

  const { basePriceUsd, basePriceKhr, stockQty, lowStockThreshold } = productValidation.values;
  const imageUrls = parseOptionalStringArray(body, "image_urls");

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
  triggerAutoProductAiAnalysis(tenantId, product.id, body?.lang);
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
  const variantValidation = validateVariantPricingAndInventory(body);
  if (variantValidation.message || !variantValidation.values) {
    return c.json({ message: variantValidation.message ?? "Invalid variant payload" }, 400);
  }

  const { priceUsd, priceKhr, stockQty, lowStockThreshold } = variantValidation.values;

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
  const variantValidation = validateVariantPricingAndInventory(body);
  if (variantValidation.message || !variantValidation.values) {
    return c.json({ message: variantValidation.message ?? "Invalid variant payload" }, 400);
  }

  const { priceUsd, priceKhr, stockQty, lowStockThreshold } = variantValidation.values;

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
