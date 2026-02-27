import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { Pinecone } from "@pinecone-database/pinecone";
import { db } from "../db";
import { productKnowledge, productVariants, products, tenants } from "../db/schema";
import { env } from "../env";
import type { PineconeMetadata } from "../types/rag";

function toUnitFloat(hash: Buffer, i: number): number {
  const value = hash.readUInt16BE((i * 2) % (hash.length - 1));
  return value / 65535;
}

function deterministicEmbed(text: string, dimensions: number): number[] {
  const seedA = createHash("sha256").update(`a:${text}`).digest();
  const seedB = createHash("sha256").update(`b:${text}`).digest();
  const out: number[] = new Array(dimensions);

  for (let i = 0; i < dimensions; i += 1) {
    const a = toUnitFloat(seedA, i);
    const b = toUnitFloat(seedB, i + 7);
    out[i] = (a + b) / 2;
  }

  return out;
}

function tenantProfileText(row: typeof tenants.$inferSelect): string {
  return [
    `Shop: ${row.shopName}`,
    `Type: ${row.shopType}`,
    row.description ? `Description: ${row.description}` : "",
    row.addressText ? `Address: ${row.addressText}` : "",
    row.googleMapUrl ? `Map: ${row.googleMapUrl}` : "",
    `Subdomain: ${row.subdomain}`,
    `Active: ${row.isActive ? "yes" : "no"}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function productText(row: typeof products.$inferSelect): string {
  return [
    `Product: ${row.name}`,
    row.category ? `Category: ${row.category}` : "",
    row.description ? `Description: ${row.description}` : "",
    `Base price USD: ${row.basePriceUsd}`,
    `Base price KHR: ${row.basePriceKhr}`,
    `Stock: ${row.stockQty}`,
    `Active: ${row.isActive ? "yes" : "no"}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function productUsageText(knowledge: typeof productKnowledge.$inferSelect | null): string {
  if (!knowledge) return "";
  return [
    knowledge.usageEn ? `Usage (EN): ${knowledge.usageEn}` : "",
    knowledge.usageKm ? `Usage (KM): ${knowledge.usageKm}` : "",
    knowledge.overviewEn ? `Overview (EN): ${knowledge.overviewEn}` : "",
    knowledge.overviewKm ? `Overview (KM): ${knowledge.overviewKm}` : "",
    knowledge.suitabilityEn ? `Suitability (EN): ${knowledge.suitabilityEn}` : "",
    knowledge.suitabilityKm ? `Suitability (KM): ${knowledge.suitabilityKm}` : "",
    knowledge.keySpecsEn ? `Key specs (EN): ${knowledge.keySpecsEn}` : "",
    knowledge.keySpecsKm ? `Key specs (KM): ${knowledge.keySpecsKm}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function variantText(
  product: typeof products.$inferSelect,
  variant: typeof productVariants.$inferSelect,
  knowledge: typeof productKnowledge.$inferSelect | null
): string {
  const usage = productUsageText(knowledge);
  return [
    `Product: ${product.name}`,
    variant.size ? `Variant size: ${variant.size}` : "",
    variant.color ? `Variant color: ${variant.color}` : "",
    `Variant price USD: ${variant.priceUsd ?? product.basePriceUsd}`,
    `Variant price KHR: ${variant.priceKhr ?? product.basePriceKhr}`,
    `Variant stock: ${variant.stockQty}`,
    `Variant active: ${variant.isActive ? "yes" : "no"}`,
    usage,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildProductMetadata(row: typeof products.$inferSelect): PineconeMetadata {
  return {
    tenantId: row.tenantId,
    entityType: "product",
    entityId: row.id,
    ...(row.category ? { productCategory: row.category } : {}),
    isActive: row.isActive,
    relationTenantNode: `tenant:${row.tenantId}`,
    relationNode: `product:${row.id}`,
    text: productText(row),
  };
}

function buildVariantMetadata(
  product: typeof products.$inferSelect,
  variant: typeof productVariants.$inferSelect,
  text: string
): PineconeMetadata {
  return {
    tenantId: product.tenantId,
    entityType: "product_variant",
    entityId: variant.id,
    productId: product.id,
    variantId: variant.id,
    ...(product.category ? { productCategory: product.category } : {}),
    ...(variant.size ? { variantSize: variant.size } : {}),
    ...(variant.color ? { variantColor: variant.color } : {}),
    isActive: variant.isActive,
    relationTenantNode: `tenant:${product.tenantId}`,
    relationNode: `product:${product.id}`,
    text,
  };
}

function productVectorId(tenantId: string, productId: string): string {
  return `tenant:${tenantId}:product:${productId}`;
}

function variantVectorId(tenantId: string, productId: string, variantId: string): string {
  return `tenant:${tenantId}:product:${productId}:variant:${variantId}`;
}

function shouldSkip(): boolean {
  return !env.PINECONE_API_KEY || !env.PINECONE_INDEX;
}

function getNamespace(tenantId: string): string {
  return `${env.PINECONE_NAMESPACE_PREFIX}-${tenantId}`;
}

function getIndex(tenantId: string) {
  const client = new Pinecone({ apiKey: env.PINECONE_API_KEY! });
  return client.index(env.PINECONE_INDEX!).namespace(getNamespace(tenantId));
}

async function buildProductRecords(tenantId: string, productId: string, dimensions: number) {
  const product = await db.query.products.findFirst({
    where: eq(products.id, productId),
  });
  if (!product || product.tenantId !== tenantId) return [];

  const [variants, knowledge] = await Promise.all([
    db.query.productVariants.findMany({
      where: eq(productVariants.productId, product.id),
    }),
    db.query.productKnowledge.findFirst({
      where: eq(productKnowledge.productId, product.id),
    }),
  ]);

  const productDoc = [productText(product), productUsageText(knowledge)].filter(Boolean).join("\n");
  const records: Array<{ id: string; values: number[]; metadata: PineconeMetadata }> = [
    {
      id: productVectorId(tenantId, product.id),
      values: deterministicEmbed(productDoc, dimensions),
      metadata: {
        ...buildProductMetadata(product),
        text: productDoc,
      },
    },
  ];

  for (const variant of variants) {
    const text = variantText(product, variant, knowledge);
    records.push({
      id: variantVectorId(tenantId, product.id, variant.id),
      values: deterministicEmbed(text, dimensions),
      metadata: buildVariantMetadata(product, variant, text),
    });
  }

  return records;
}

export const ragService = {
  async indexTenant(tenantId: string): Promise<void> {
    if (shouldSkip()) return;

    const dimensions = env.PINECONE_VECTOR_DIM;

    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
    });
    if (!tenant) return;

    const tenantProducts = await db.query.products.findMany({
      where: eq(products.tenantId, tenantId),
    });

    const index = getIndex(tenantId);

    const vectors: Array<{ id: string; values: number[]; metadata: PineconeMetadata }> = [
      {
        id: `tenant:${tenant.id}:profile`,
        values: deterministicEmbed(tenantProfileText(tenant), dimensions),
        metadata: {
          tenantId: tenant.id,
          entityType: "tenant_profile",
          entityId: tenant.id,
          subdomain: tenant.subdomain,
          shopType: tenant.shopType,
          isActive: tenant.isActive,
          relationTenantNode: `tenant:${tenant.id}`,
          relationNode: `tenant:${tenant.id}`,
          text: tenantProfileText(tenant),
        } satisfies PineconeMetadata,
      },
    ];

    for (const product of tenantProducts) {
      const records = await buildProductRecords(tenantId, product.id, dimensions);
      vectors.push(...records);
    }

    if (vectors.length === 0) return;
    await index.upsert({ records: vectors });
  },

  async indexProduct(tenantId: string, productId: string): Promise<void> {
    if (shouldSkip()) return;

    const dimensions = env.PINECONE_VECTOR_DIM;
    const records = await buildProductRecords(tenantId, productId, dimensions);
    if (records.length === 0) return;
    const index = getIndex(tenantId);
    await index.upsert({ records });
  },

  async deleteProductVector(tenantId: string, productId: string): Promise<void> {
    if (shouldSkip()) return;
    const indexAny = getIndex(tenantId) as any;
    if (typeof indexAny.deleteMany === "function") {
      await indexAny.deleteMany([productVectorId(tenantId, productId)]);
    }
  },

  async reindexProduct(tenantId: string, productId: string): Promise<void> {
    if (shouldSkip()) return;
    const indexAny = getIndex(tenantId) as any;
    if (typeof indexAny.deleteMany === "function") {
      await indexAny.deleteMany({ relationNode: `product:${productId}` });
    }
    await this.indexProduct(tenantId, productId);
  },

  async searchTenant(tenantId: string, query: string, topK = 10) {
    if (shouldSkip()) return [];

    const dimensions = env.PINECONE_VECTOR_DIM;
    const index = getIndex(tenantId);

    const result = await index.query({
      vector: deterministicEmbed(query, dimensions),
      topK,
      includeMetadata: true,
    });

    return result.matches ?? [];
  },
};
