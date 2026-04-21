import { createHmac, timingSafeEqual } from "node:crypto";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "../db";
import { orders, products, tenants } from "../db/schema";
import { env } from "../env";
import { uploadStoreAssetToCloudinary } from "../lib/cloudinary";
import { withStoreUrl } from "../lib/store-url";
import { listLowStockItems } from "./inventory.service";
import { getOwnerOrderById, listOwnerOrders, updateOwnerOrderPayment, updateOwnerOrderStatus } from "./order.service";
import {
  appendProductImageUrl,
  createProduct,
  deactivateProduct,
  getProductById,
  getProductImageCount,
  listProducts,
  updateProduct,
  updateProductStock,
} from "./product.service";
import { getTenantById } from "./tenant.service";
import { getTenantLinkByTelegramUser } from "./telegram-link.service";
import { uploadProductImageToCloudinary } from "../lib/cloudinary";
import type { ShopType } from "../types/tenant";

export type TelegramMiniAppClaims = {
  v: 1;
  tenantId: string;
  telegramUserId: number;
  authDate: number;
  issuedAt: number;
  expiresAt: number;
};

type TelegramMiniAppUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
};

export type TelegramMiniAppSession = {
  token: string;
  expiresAt: number;
  tenant: any;
  telegramUser: TelegramMiniAppUser;
};

function base64urlEncode(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function base64urlDecode(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

function signTelegramMiniAppValue(value: string): string {
  return createHmac("sha256", env.BETTER_AUTH_SECRET)
    .update(`telegram-miniapp:${value}`)
    .digest("base64url");
}

function issueTelegramMiniAppToken(claims: TelegramMiniAppClaims): string {
  const payload = base64urlEncode(JSON.stringify(claims));
  const signature = signTelegramMiniAppValue(payload);
  return `tgma_${payload}.${signature}`;
}

function parseTelegramMiniAppToken(token: string): TelegramMiniAppClaims | null {
  if (!token.startsWith("tgma_")) {
    return null;
  }

  const raw = token.slice("tgma_".length);
  const [payload, signature] = raw.split(".");
  if (!payload || !signature) {
    return null;
  }

  const expected = signTelegramMiniAppValue(payload);
  const actualBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const parsed = JSON.parse(base64urlDecode(payload)) as TelegramMiniAppClaims;
    if (parsed.v !== 1 || !parsed.tenantId || !Number.isFinite(parsed.telegramUserId)) {
      return null;
    }
    if (parsed.expiresAt <= Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function verifyTelegramInitData(initData: string): { authDate: number; user: TelegramMiniAppUser } {
  if (!env.TELEGRAM_BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN is required.");
  }

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  const userRaw = params.get("user");
  const authDateRaw = params.get("auth_date");

  if (!hash || !userRaw || !authDateRaw) {
    throw new Error("Telegram initData is incomplete.");
  }

  const pairs: string[] = [];
  params.forEach((value, key) => {
    if (key === "hash") return;
    pairs.push(`${key}=${value}`);
  });
  const dataCheckString = pairs.sort((a, b) => a.localeCompare(b)).join("\n");
  const secret = createHmac("sha256", "WebAppData").update(env.TELEGRAM_BOT_TOKEN).digest();
  const actual = createHmac("sha256", secret).update(dataCheckString).digest("hex");

  const actualBuffer = Buffer.from(actual, "utf8");
  const expectedBuffer = Buffer.from(hash, "utf8");
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    throw new Error("Telegram initData signature is invalid.");
  }

  const authDate = Number.parseInt(authDateRaw, 10);
  if (!Number.isFinite(authDate)) {
    throw new Error("Telegram auth_date is invalid.");
  }

  const user = JSON.parse(userRaw) as TelegramMiniAppUser;
  if (!user?.id) {
    throw new Error("Telegram user is missing.");
  }

  return { authDate, user };
}

function toInteger(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && /^-?\d+$/.test(value.trim())) {
    return Number.parseInt(value.trim(), 10);
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

function cleanText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function readImageUrls(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

function requireMiniAppClaims(authorization?: string | null) {
  const token = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length).trim() : "";
  const claims = token ? parseTelegramMiniAppToken(token) : null;
  if (!claims) {
    throw new Error("Unauthorized");
  }
  return claims;
}

export function readTelegramMiniAppClaimsFromAuthHeader(authorization?: string | null) {
  return requireMiniAppClaims(authorization);
}

export async function createTelegramMiniAppSession(initData: string) {
  const verified = verifyTelegramInitData(initData);
  const link = await getTenantLinkByTelegramUser(verified.user.id);
  if (!link) {
    throw new Error("This Telegram account is not linked to a store yet.");
  }

  const tenant = await getTenantById(link.tenantId);
  if (!tenant) {
    throw new Error("Linked tenant was not found.");
  }

  const issuedAt = Date.now();
  const expiresAt = issuedAt + env.TELEGRAM_MINI_APP_SESSION_TTL_MINUTES * 60 * 1000;
  const token = issueTelegramMiniAppToken({
    v: 1,
    tenantId: tenant.id,
    telegramUserId: verified.user.id,
    authDate: verified.authDate,
    issuedAt,
    expiresAt,
  });

  return {
    token,
    expiresAt,
    tenant: withStoreUrl(tenant),
    telegramUser: verified.user,
  };
}

export async function getTelegramMiniAppBootstrap(authorization?: string | null) {
  const claims = requireMiniAppClaims(authorization);
  const tenant = await getTenantById(claims.tenantId);
  if (!tenant) {
    throw new Error("Tenant not found");
  }

  const [productStats, orderStatsRows, recentProducts, recentOrders, lowStockItems] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*)::int`,
        active: sql<number>`count(*) filter (where ${products.isActive} = true)::int`,
      })
      .from(products)
      .where(eq(products.tenantId, claims.tenantId)),
    db
      .select({
        total: sql<number>`count(*)::int`,
        pending: sql<number>`count(*) filter (where ${orders.status} = 'pending')::int`,
        confirmed: sql<number>`count(*) filter (where ${orders.status} = 'confirmed')::int`,
        paid: sql<number>`count(*) filter (where ${orders.paymentStatus} = 'paid')::int`,
      })
      .from(orders)
      .where(eq(orders.tenantId, claims.tenantId)),
    db.query.products.findMany({
      where: eq(products.tenantId, claims.tenantId),
      orderBy: [desc(products.createdAt)],
      limit: 5,
    }),
    listOwnerOrders(claims.tenantId, {}).then((rows) => rows.slice(0, 5)),
    listLowStockItems(claims.tenantId),
  ]);

  return {
    tenant: withStoreUrl(tenant),
    stats: {
      products: productStats[0] ?? { total: 0, active: 0 },
      orders: orderStatsRows[0] ?? { total: 0, pending: 0, confirmed: 0, paid: 0 },
      lowStock: lowStockItems.length,
    },
    recentProducts,
    recentOrders,
    lowStockItems: lowStockItems.slice(0, 10),
  };
}

export async function getTelegramMiniAppTenant(authorization?: string | null) {
  const claims = requireMiniAppClaims(authorization);
  const tenant = await getTenantById(claims.tenantId);
  if (!tenant) {
    throw new Error("Tenant not found");
  }
  return withStoreUrl(tenant);
}

export async function updateTelegramMiniAppTenant(
  authorization: string | null | undefined,
  body: Record<string, unknown>
) {
  const claims = requireMiniAppClaims(authorization);
  const tenant = await getTenantById(claims.tenantId);
  if (!tenant) {
    throw new Error("Tenant not found");
  }

  const patch: Partial<typeof tenants.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (body.shop_name !== undefined && cleanText(body.shop_name)) patch.shopName = cleanText(body.shop_name)!;
  if (body.shop_type !== undefined && cleanText(body.shop_type)) patch.shopType = cleanText(body.shop_type)! as ShopType;
  if (body.description !== undefined) patch.description = cleanText(body.description);
  if (body.address_text !== undefined) patch.addressText = cleanText(body.address_text);
  if (body.google_map_url !== undefined) patch.googleMapUrl = cleanText(body.google_map_url);
  if (body.logo_url !== undefined) patch.logoUrl = cleanText(body.logo_url);
  if (body.banner_url !== undefined) patch.bannerUrl = cleanText(body.banner_url);
  if (typeof body.is_active === "boolean") patch.isActive = body.is_active;

  const updated = await db
    .update(tenants)
    .set(patch)
    .where(eq(tenants.id, claims.tenantId))
    .returning();

  const nextTenant = updated[0] ?? null;
  if (!nextTenant) {
    throw new Error("Tenant not found");
  }

  return withStoreUrl(nextTenant);
}

export async function uploadTelegramMiniAppStoreAsset(
  authorization: string | null | undefined,
  type: "logo" | "banner",
  file: File
) {
  const claims = requireMiniAppClaims(authorization);
  const tenant = await getTenantById(claims.tenantId);
  if (!tenant) {
    throw new Error("Tenant not found");
  }

  return uploadStoreAssetToCloudinary({
    type,
    file,
    ownerUserId: tenant.ownerUserId,
  });
}

export async function listTelegramMiniAppProducts(
  authorization: string | null | undefined,
  query: { q?: string; page?: string; page_size?: string; include_inactive?: string }
) {
  const claims = requireMiniAppClaims(authorization);
  return listProducts(claims.tenantId, {
    q: query.q ?? "",
    page: toInteger(query.page) ?? 1,
    pageSize: toInteger(query.page_size) ?? 20,
    includeInactive: query.include_inactive === "true",
  });
}

export async function getTelegramMiniAppProduct(authorization: string | null | undefined, productId: string) {
  const claims = requireMiniAppClaims(authorization);
  return getProductById(claims.tenantId, productId);
}

export async function createTelegramMiniAppProduct(
  authorization: string | null | undefined,
  body: Record<string, unknown>
) {
  const claims = requireMiniAppClaims(authorization);
  const name = cleanText(body.name);
  if (!name) {
    throw new Error("name is required");
  }

  return createProduct(claims.tenantId, {
    name,
    description: body.description,
    category: body.category,
    basePriceUsd: body.base_price_usd !== undefined ? toNumericString(body.base_price_usd) ?? undefined : undefined,
    basePriceKhr: body.base_price_khr !== undefined ? toNumericString(body.base_price_khr) ?? undefined : undefined,
    trackInventory: typeof body.track_inventory === "boolean" ? body.track_inventory : undefined,
    stockQty: body.stock_qty !== undefined ? toInteger(body.stock_qty) ?? undefined : undefined,
    lowStockThreshold:
      body.low_stock_threshold !== undefined ? toInteger(body.low_stock_threshold) ?? undefined : undefined,
    hasVariants: typeof body.has_variants === "boolean" ? body.has_variants : undefined,
    imageUrls: readImageUrls(body.image_urls),
  });
}

export async function updateTelegramMiniAppProduct(
  authorization: string | null | undefined,
  productId: string,
  body: Record<string, unknown>
) {
  const claims = requireMiniAppClaims(authorization);
  return updateProduct(claims.tenantId, productId, {
    name: cleanText(body.name) ?? undefined,
    description: body.description,
    category: body.category,
    basePriceUsd: body.base_price_usd !== undefined ? toNumericString(body.base_price_usd) ?? undefined : undefined,
    basePriceKhr: body.base_price_khr !== undefined ? toNumericString(body.base_price_khr) ?? undefined : undefined,
    trackInventory: typeof body.track_inventory === "boolean" ? body.track_inventory : undefined,
    stockQty: body.stock_qty !== undefined ? toInteger(body.stock_qty) ?? undefined : undefined,
    lowStockThreshold:
      body.low_stock_threshold !== undefined ? toInteger(body.low_stock_threshold) ?? undefined : undefined,
    hasVariants: typeof body.has_variants === "boolean" ? body.has_variants : undefined,
    imageUrls: body.image_urls !== undefined ? readImageUrls(body.image_urls) : undefined,
    isActive: typeof body.is_active === "boolean" ? body.is_active : undefined,
  });
}

export async function deactivateTelegramMiniAppProduct(authorization: string | null | undefined, productId: string) {
  const claims = requireMiniAppClaims(authorization);
  return deactivateProduct(claims.tenantId, productId);
}

export async function updateTelegramMiniAppProductStock(
  authorization: string | null | undefined,
  productId: string,
  stockQty: unknown
) {
  const claims = requireMiniAppClaims(authorization);
  const parsed = toInteger(stockQty);
  if (parsed === null) {
    throw new Error("stock_qty must be an integer");
  }
  return updateProductStock(claims.tenantId, productId, parsed);
}

export async function uploadTelegramMiniAppProductImage(
  authorization: string | null | undefined,
  productId: string,
  file: File
) {
  const claims = requireMiniAppClaims(authorization);
  const imageCount = await getProductImageCount(claims.tenantId, productId);
  if (imageCount === null) {
    throw new Error("Product not found");
  }
  if (imageCount >= 3) {
    throw new Error("Maximum 3 images allowed per product");
  }

  const upload = await uploadProductImageToCloudinary({
    file,
    tenantId: claims.tenantId,
    productId,
  });
  const product = await appendProductImageUrl(claims.tenantId, productId, upload.publicUrl);
  if (!product) {
    throw new Error("Product not found");
  }
  return { upload, imageUrls: product.imageUrls };
}

export async function listTelegramMiniAppOrders(
  authorization: string | null | undefined,
  query: { status?: string | null; from?: string | null; to?: string | null }
) {
  const claims = requireMiniAppClaims(authorization);
  return listOwnerOrders(claims.tenantId, query);
}

export async function getTelegramMiniAppOrder(authorization: string | null | undefined, orderId: string) {
  const claims = requireMiniAppClaims(authorization);
  return getOwnerOrderById(claims.tenantId, orderId);
}

export async function updateTelegramMiniAppOrderStatus(
  authorization: string | null | undefined,
  orderId: string,
  status: "pending" | "confirmed" | "delivering" | "completed" | "cancelled"
) {
  const claims = requireMiniAppClaims(authorization);
  return updateOwnerOrderStatus(claims.tenantId, orderId, status);
}

export async function updateTelegramMiniAppOrderPayment(
  authorization: string | null | undefined,
  orderId: string,
  body: {
    payment_status: "unpaid" | "paid" | "refunded";
    method?: "cod" | "aba_transfer";
    amount?: string | number | null;
    reference?: string | null;
    paid_at?: string | null;
  }
) {
  const claims = requireMiniAppClaims(authorization);
  return updateOwnerOrderPayment(claims.tenantId, orderId, body);
}

export async function cancelTelegramMiniAppOrder(authorization: string | null | undefined, orderId: string) {
  const claims = requireMiniAppClaims(authorization);
  return updateOwnerOrderStatus(claims.tenantId, orderId, "cancelled");
}

export async function listTelegramMiniAppLowStock(authorization: string | null | undefined) {
  const claims = requireMiniAppClaims(authorization);
  return listLowStockItems(claims.tenantId);
}
