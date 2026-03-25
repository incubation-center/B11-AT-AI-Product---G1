import { eq } from "drizzle-orm";
import { Pinecone } from "@pinecone-database/pinecone";
import { db } from "../db";
import { productKnowledge, productVariants, products, tenants } from "../db/schema";
import { env } from "../env";
import type { PineconeMetadata } from "../types/rag";

// ---------------------------------------------------------------------------
// Real OpenAI embedding — text-embedding-3-small
// ---------------------------------------------------------------------------
export async function embedText(text: string): Promise<number[]> {
  if (!env.OPEN_AI_API) throw new Error("OPEN_AI_API is required for embeddings.");

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPEN_AI_API}`,
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text.slice(0, 8000), // stay within token limit
      dimensions: env.PINECONE_VECTOR_DIM, // matches Pinecone index
    }),
  });

  if (!res.ok) {
    const raw = await res.text();
    throw new Error(`OpenAI embed failed: ${raw}`);
  }

  const json = (await res.json()) as { data: Array<{ embedding: number[] }> };
  return json.data[0].embedding;
}

// ---------------------------------------------------------------------------
// Text builders
// ---------------------------------------------------------------------------
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

function buildProductMetadata(
  row: typeof products.$inferSelect,
  tenant: typeof tenants.$inferSelect
): PineconeMetadata {
  return {
    tenantId: row.tenantId,
    entityType: "product",
    entityId: row.id,
    ...(row.category ? { productCategory: row.category } : {}),
    isActive: row.isActive,
    relationTenantNode: `tenant:${row.tenantId}`,
    relationNode: `product:${row.id}`,
    text: productText(row),
    subdomain: tenant.subdomain,
    shopName: tenant.shopName,
  };
}

function buildVariantMetadata(
  product: typeof products.$inferSelect,
  variant: typeof productVariants.$inferSelect,
  tenant: typeof tenants.$inferSelect,
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
    subdomain: tenant.subdomain,
    shopName: tenant.shopName,
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

function getGlobalIndex() {
  const client = new Pinecone({ apiKey: env.PINECONE_API_KEY! });
  return client.index(env.PINECONE_INDEX!).namespace("");
}

// ---------------------------------------------------------------------------
// Build product records (async — calls embedText)
// ---------------------------------------------------------------------------
async function buildProductRecords(tenantId: string, productId: string) {
  const product = await db.query.products.findFirst({
    where: eq(products.id, productId),
  });
  if (!product || product.tenantId !== tenantId) return [];

  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
  });
  if (!tenant) return [];

  const [variants, rawKnowledge] = await Promise.all([
    db.query.productVariants.findMany({
      where: eq(productVariants.productId, product.id),
    }),
    db.query.productKnowledge.findFirst({
      where: eq(productKnowledge.productId, product.id),
    }),
  ]);
  const knowledge = rawKnowledge ?? null;

  const productDoc = [productText(product), productUsageText(knowledge)].filter(Boolean).join("\n");

  const records: Array<{ id: string; values: number[]; metadata: PineconeMetadata }> = [
    {
      id: productVectorId(tenantId, product.id),
      values: await embedText(productDoc),
      metadata: {
        ...buildProductMetadata(product, tenant),
        text: productDoc,
      },
    },
  ];

  for (const variant of variants) {
    const text = variantText(product, variant, knowledge);
    records.push({
      id: variantVectorId(tenantId, product.id, variant.id),
      values: await embedText(text),
      metadata: buildVariantMetadata(product, variant, tenant, text),
    });
  }

  return records;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export const ragService = {
  async indexTenant(tenantId: string): Promise<void> {
    if (shouldSkip()) return;

    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
    });
    if (!tenant) return;

    const tenantProducts = await db.query.products.findMany({
      where: eq(products.tenantId, tenantId),
    });

    const index = getIndex(tenantId);
    const tenantText = tenantProfileText(tenant);

    const vectors: Array<{ id: string; values: number[]; metadata: PineconeMetadata }> = [
      {
        id: `tenant:${tenant.id}:profile`,
        values: await embedText(tenantText),
        metadata: {
          tenantId: tenant.id,
          entityType: "tenant_profile",
          entityId: tenant.id,
          subdomain: tenant.subdomain,
          shopType: tenant.shopType,
          isActive: tenant.isActive,
          relationTenantNode: `tenant:${tenant.id}`,
          relationNode: `tenant:${tenant.id}`,
          text: tenantText,
        } satisfies PineconeMetadata,
      },
    ];

    for (const product of tenantProducts) {
      const records = await buildProductRecords(tenantId, product.id);
      vectors.push(...records);
    }

    if (vectors.length === 0) return;
    await index.upsert({ records: vectors });
    await getGlobalIndex().upsert({ records: vectors });
  },

  async indexProduct(tenantId: string, productId: string): Promise<void> {
    if (shouldSkip()) return;
    const records = await buildProductRecords(tenantId, productId);
    if (records.length === 0) return;
    const index = getIndex(tenantId);
    await index.upsert({ records });
    await getGlobalIndex().upsert({ records });
  },

  async deleteProductVector(tenantId: string, productId: string): Promise<void> {
    if (shouldSkip()) return;
    const indexAny = getIndex(tenantId) as any;
    if (typeof indexAny.deleteMany === "function") {
      await indexAny.deleteMany({ ids: [productVectorId(tenantId, productId)] });
    }
    const globalIndexAny = getGlobalIndex() as any;
    if (typeof globalIndexAny.deleteMany === "function") {
      await globalIndexAny.deleteMany({ ids: [productVectorId(tenantId, productId)] });
    }
  },

  async reindexProduct(tenantId: string, productId: string): Promise<void> {
    if (shouldSkip()) return;
    const indexAny = getIndex(tenantId) as any;
    if (typeof indexAny.deleteMany === "function") {
      await indexAny.deleteMany({
        filter: { relationNode: { $eq: `product:${productId}` } },
      });
    }
    const globalIndexAny = getGlobalIndex() as any;
    if (typeof globalIndexAny.deleteMany === "function") {
      await globalIndexAny.deleteMany({
        filter: { relationNode: { $eq: `product:${productId}` } },
      });
    }
    await this.indexProduct(tenantId, productId);
  },

  async searchTenant(tenantId: string, query: string, topK = 10) {
    if (shouldSkip()) return [];
    const index = getIndex(tenantId);
    const result = await index.query({
      vector: await embedText(query),
      topK,
      includeMetadata: true,
    });
    return result.matches ?? [];
  },
};
