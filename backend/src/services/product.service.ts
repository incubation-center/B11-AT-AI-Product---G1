import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "../db";
import { productVariants, products, tenants } from "../db/schema";
import { ragService } from "./rag.service";

function cleanText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function triggerTenantIndex(tenantId: string) {
  void ragService.indexTenant(tenantId).catch((error) => {
    console.error("[rag] indexTenant failed", { tenantId, error });
  });
}

export type CreateProductInput = {
  name: string;
  description?: unknown;
  category?: unknown;
  basePriceUsd?: string;
  basePriceKhr?: string;
  trackInventory?: boolean;
  stockQty?: number;
  lowStockThreshold?: number;
  hasVariants?: boolean;
  imageUrls?: string[];
};

export type UpdateProductInput = {
  name?: string;
  description?: unknown;
  category?: unknown;
  basePriceUsd?: string;
  basePriceKhr?: string;
  trackInventory?: boolean;
  stockQty?: number;
  lowStockThreshold?: number;
  hasVariants?: boolean;
  imageUrls?: string[];
  isActive?: boolean;
};

export type CreateVariantInput = {
  size?: unknown;
  color?: unknown;
  priceUsd?: string;
  priceKhr?: string;
  stockQty?: number;
  lowStockThreshold?: number;
  isActive?: boolean;
};

export type UpdateVariantInput = CreateVariantInput;

export async function createProduct(tenantId: string, input: CreateProductInput) {
  const inserted = await db
    .insert(products)
    .values({
      tenantId,
      name: input.name.trim(),
      description: cleanText(input.description),
      category: cleanText(input.category),
      basePriceUsd: input.basePriceUsd ?? "0",
      basePriceKhr: input.basePriceKhr ?? "0",
      trackInventory: input.trackInventory ?? true,
      stockQty: input.stockQty ?? 0,
      lowStockThreshold: input.lowStockThreshold ?? 5,
      hasVariants: input.hasVariants ?? false,
      imageUrls: input.imageUrls ?? [],
      isActive: true,
    })
    .returning();

  const product = inserted[0] ?? null;
  if (product) triggerTenantIndex(tenantId);
  return product;
}

export async function listProducts(
  tenantId: string,
  options: { q?: string; page?: number; pageSize?: number; includeInactive?: boolean }
) {
  const page = clamp(options.page ?? 1, 1, 100000);
  const pageSize = clamp(options.pageSize ?? 20, 1, 100);
  const offset = (page - 1) * pageSize;

  const search = typeof options.q === "string" ? options.q.trim() : "";

  const where = and(
    eq(products.tenantId, tenantId),
    options.includeInactive ? undefined : eq(products.isActive, true),
    search
      ? or(
          ilike(products.name, `%${search}%`),
          ilike(products.category, `%${search}%`),
          ilike(products.description, `%${search}%`)
        )
      : undefined
  );

  const [rows, countRows] = await Promise.all([
    db.query.products.findMany({
      where,
      orderBy: [desc(products.createdAt)],
      limit: pageSize,
      offset,
    }),
    db.select({ count: sql<number>`count(*)::int` }).from(products).where(where),
  ]);

  const total = countRows[0]?.count ?? 0;
  return {
    data: rows,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

export async function getProductById(tenantId: string, productId: string) {
  const product = await db.query.products.findFirst({
    where: and(eq(products.id, productId), eq(products.tenantId, tenantId)),
  });

  if (!product) return null;

  const variants = await db.query.productVariants.findMany({
    where: and(eq(productVariants.productId, productId), eq(productVariants.tenantId, tenantId)),
    orderBy: [desc(productVariants.id)],
  });

  return {
    ...product,
    variants,
  };
}

export async function updateProduct(tenantId: string, productId: string, input: UpdateProductInput) {
  const patch: Partial<typeof products.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.description !== undefined) patch.description = cleanText(input.description);
  if (input.category !== undefined) patch.category = cleanText(input.category);
  if (input.basePriceUsd !== undefined) patch.basePriceUsd = input.basePriceUsd;
  if (input.basePriceKhr !== undefined) patch.basePriceKhr = input.basePriceKhr;
  if (input.trackInventory !== undefined) patch.trackInventory = input.trackInventory;
  if (input.stockQty !== undefined) patch.stockQty = input.stockQty;
  if (input.lowStockThreshold !== undefined) patch.lowStockThreshold = input.lowStockThreshold;
  if (input.hasVariants !== undefined) patch.hasVariants = input.hasVariants;
  if (input.imageUrls !== undefined) patch.imageUrls = input.imageUrls;
  if (input.isActive !== undefined) patch.isActive = input.isActive;

  const updated = await db
    .update(products)
    .set(patch)
    .where(and(eq(products.id, productId), eq(products.tenantId, tenantId)))
    .returning();

  const product = updated[0] ?? null;
  if (product) triggerTenantIndex(tenantId);
  return product;
}

export async function deactivateProduct(tenantId: string, productId: string) {
  return updateProduct(tenantId, productId, { isActive: false });
}

export async function updateProductStock(tenantId: string, productId: string, stockQty: number) {
  return updateProduct(tenantId, productId, { stockQty });
}

export async function createVariant(tenantId: string, productId: string, input: CreateVariantInput) {
  const parent = await db.query.products.findFirst({
    where: and(eq(products.id, productId), eq(products.tenantId, tenantId)),
    columns: { id: true },
  });

  if (!parent) return null;

  const inserted = await db
    .insert(productVariants)
    .values({
      tenantId,
      productId,
      size: cleanText(input.size),
      color: cleanText(input.color),
      priceUsd: input.priceUsd ?? null,
      priceKhr: input.priceKhr ?? null,
      stockQty: input.stockQty ?? 0,
      lowStockThreshold: input.lowStockThreshold ?? 5,
      isActive: input.isActive ?? true,
    })
    .returning();

  const variant = inserted[0] ?? null;
  if (variant) triggerTenantIndex(tenantId);
  return variant;
}

export async function updateVariant(tenantId: string, variantId: string, input: UpdateVariantInput) {
  const patch: Partial<typeof productVariants.$inferInsert> = {};

  if (input.size !== undefined) patch.size = cleanText(input.size);
  if (input.color !== undefined) patch.color = cleanText(input.color);
  if (input.priceUsd !== undefined) patch.priceUsd = input.priceUsd;
  if (input.priceKhr !== undefined) patch.priceKhr = input.priceKhr;
  if (input.stockQty !== undefined) patch.stockQty = input.stockQty;
  if (input.lowStockThreshold !== undefined) patch.lowStockThreshold = input.lowStockThreshold;
  if (input.isActive !== undefined) patch.isActive = input.isActive;

  const updated = await db
    .update(productVariants)
    .set(patch)
    .where(and(eq(productVariants.id, variantId), eq(productVariants.tenantId, tenantId)))
    .returning();

  const variant = updated[0] ?? null;
  if (variant) triggerTenantIndex(tenantId);
  return variant;
}

export async function updateVariantStock(tenantId: string, variantId: string, stockQty: number) {
  return updateVariant(tenantId, variantId, { stockQty });
}

export async function deactivateVariant(tenantId: string, variantId: string) {
  return updateVariant(tenantId, variantId, { isActive: false });
}

export async function appendProductImageUrl(tenantId: string, productId: string, imageUrl: string) {
  const found = await db.query.products.findFirst({
    where: and(eq(products.id, productId), eq(products.tenantId, tenantId)),
    columns: { id: true, imageUrls: true },
  });
  if (!found) return null;
  if (found.imageUrls.length >= 3) {
    throw new Error("IMAGE_LIMIT_REACHED");
  }

  const updated = await db
    .update(products)
    .set({
      imageUrls: [...found.imageUrls, imageUrl],
      updatedAt: new Date(),
    })
    .where(and(eq(products.id, productId), eq(products.tenantId, tenantId)))
    .returning();

  const product = updated[0] ?? null;
  if (product) triggerTenantIndex(tenantId);
  return product;
}

export async function getProductImageCount(tenantId: string, productId: string) {
  const found = await db.query.products.findFirst({
    where: and(eq(products.id, productId), eq(products.tenantId, tenantId)),
    columns: { id: true, imageUrls: true },
  });
  if (!found) return null;
  return found.imageUrls.length;
}

async function getActiveTenantBySubdomain(subdomain: string) {
  return db.query.tenants.findFirst({
    where: and(eq(tenants.subdomain, subdomain), eq(tenants.isActive, true)),
    columns: { id: true, subdomain: true, shopName: true },
  });
}

export async function listPublicProductsBySubdomain(
  subdomain: string,
  options: { q?: string; page?: number; pageSize?: number }
) {
  const tenant = await getActiveTenantBySubdomain(subdomain);
  if (!tenant) return null;

  const page = clamp(options.page ?? 1, 1, 100000);
  const pageSize = clamp(options.pageSize ?? 20, 1, 100);
  const offset = (page - 1) * pageSize;
  const search = typeof options.q === "string" ? options.q.trim() : "";

  const where = and(
    eq(products.tenantId, tenant.id),
    eq(products.isActive, true),
    search
      ? or(
          ilike(products.name, `%${search}%`),
          ilike(products.category, `%${search}%`),
          ilike(products.description, `%${search}%`)
        )
      : undefined
  );

  const [rows, countRows] = await Promise.all([
    db.query.products.findMany({
      where,
      orderBy: [desc(products.createdAt)],
      limit: pageSize,
      offset,
    }),
    db.select({ count: sql<number>`count(*)::int` }).from(products).where(where),
  ]);

  const total = countRows[0]?.count ?? 0;
  return {
    tenant,
    data: rows,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

export async function getPublicProductBySubdomain(subdomain: string, productId: string) {
  const tenant = await getActiveTenantBySubdomain(subdomain);
  if (!tenant) return null;

  const product = await db.query.products.findFirst({
    where: and(eq(products.id, productId), eq(products.tenantId, tenant.id), eq(products.isActive, true)),
  });
  if (!product) return null;

  const variants = await db.query.productVariants.findMany({
    where: and(eq(productVariants.productId, productId), eq(productVariants.tenantId, tenant.id), eq(productVariants.isActive, true)),
    orderBy: [desc(productVariants.id)],
  });

  return {
    tenant,
    product: {
      ...product,
      variants,
    },
  };
}
