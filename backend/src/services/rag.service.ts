import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { Pinecone } from "@pinecone-database/pinecone";
import { db } from "../db";
import { products, tenants } from "../db/schema";

type PineconeMetadata = {
  tenantId: string;
  entityType: "tenant_profile" | "product";
  entityId: string;
  subdomain?: string;
  shopType?: string;
  productCategory?: string;
  isActive: boolean;
  relationTenantNode: string;
  relationNode: string;
  text: string;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required.`);
  }
  return value;
}

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

function shouldSkip(): boolean {
  return !process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX;
}

export const ragService = {
  async indexTenant(tenantId: string): Promise<void> {
    if (shouldSkip()) return;

    const apiKey = requireEnv("PINECONE_API_KEY");
    const indexName = requireEnv("PINECONE_INDEX");
    const namespace = process.env.PINECONE_NAMESPACE_PREFIX
      ? `${process.env.PINECONE_NAMESPACE_PREFIX}-${tenantId}`
      : tenantId;
    const dimensions = Number(process.env.PINECONE_VECTOR_DIM ?? "256");

    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
    });
    if (!tenant) return;

    const tenantProducts = await db.query.products.findMany({
      where: eq(products.tenantId, tenantId),
    });

    const client = new Pinecone({ apiKey });
    const index = client.index(indexName).namespace(namespace);

    const vectors = [
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
      ...tenantProducts.map((product) => ({
        id: `tenant:${tenant.id}:product:${product.id}`,
        values: deterministicEmbed(productText(product), dimensions),
        metadata: {
          tenantId: tenant.id,
          entityType: "product",
          entityId: product.id,
          productCategory: product.category ?? undefined,
          isActive: product.isActive,
          relationTenantNode: `tenant:${tenant.id}`,
          relationNode: `product:${product.id}`,
          text: productText(product),
        } satisfies PineconeMetadata,
      })),
    ];

    if (vectors.length === 0) return;
    await index.upsert({ records: vectors });
  },

  async searchTenant(tenantId: string, query: string, topK = 10) {
    if (shouldSkip()) return [];

    const apiKey = requireEnv("PINECONE_API_KEY");
    const indexName = requireEnv("PINECONE_INDEX");
    const namespace = process.env.PINECONE_NAMESPACE_PREFIX
      ? `${process.env.PINECONE_NAMESPACE_PREFIX}-${tenantId}`
      : tenantId;
    const dimensions = Number(process.env.PINECONE_VECTOR_DIM ?? "256");

    const client = new Pinecone({ apiKey });
    const index = client.index(indexName).namespace(namespace);

    const result = await index.query({
      vector: deterministicEmbed(query, dimensions),
      topK,
      includeMetadata: true,
    });

    return result.matches ?? [];
  },
};
