import { Pinecone } from "@pinecone-database/pinecone";
import { env } from "../env";
import { embedText } from "./rag.service";

export type GlobalSearchMatch = {
  score: number;
  entityType: string;
  entityId: string;
  tenantId: string;
  subdomain: string;
  shopName: string;
  productName: string;
  category: string;
  priceUsd: string;
  text: string;
  storeUrl: string;
};

function toText(val: unknown): string {
  return typeof val === "string" ? val.trim() : "";
}

function buildStoreUrl(subdomain: string): string {
  const protocol = env.STORE_URL_PROTOCOL ?? "http";
  const domain = env.STORE_BASE_DOMAIN ?? "lvh.me";
  const port = env.STORE_URL_PORT ?? "3000";
  return `${protocol}://${subdomain}.${domain}:${port}`;
}

/**
 * Search across ALL tenant namespaces in Pinecone simultaneously.
 * Pinecone supports global (no-namespace) queries on indexes.
 */
export async function globalProductSearch(query: string, topK = 8): Promise<GlobalSearchMatch[]> {
  if (!env.PINECONE_API_KEY || !env.PINECONE_INDEX) return [];

  const client = new Pinecone({ apiKey: env.PINECONE_API_KEY });
  // Query without namespace = searches all namespaces globally
  const index = client.index(env.PINECONE_INDEX);

  const vector = await embedText(query);
  const result = await index.query({
    vector,
    topK,
    includeMetadata: true,
    filter: { isActive: { $eq: true } },
  });

  const matches = result.matches ?? [];

  return matches
    .filter((m) => {
      const t = toText((m.metadata as Record<string, unknown>)?.entityType);
      return t === "product" || t === "product_variant";
    })
    .map((m) => {
      const meta = (m.metadata ?? {}) as Record<string, unknown>;
      const subdomain = toText(meta.subdomain) || toText(meta.tenantId);
      return {
        score: typeof m.score === "number" ? m.score : 0,
        entityType: toText(meta.entityType),
        entityId: toText(meta.entityId),
        tenantId: toText(meta.tenantId),
        subdomain,
        shopName: toText(meta.shopName) || subdomain,
        productName: toText(meta.productName) || resolveProductName(toText(meta.text)),
        category: toText(meta.productCategory),
        priceUsd: toText(meta.priceUsd) || resolvePrice(toText(meta.text)),
        text: toText(meta.text),
        storeUrl: buildStoreUrl(subdomain),
      };
    });
}

function resolveProductName(text: string): string {
  const match = /Product:\s*(.+)/i.exec(text);
  return match ? (match[1]?.trim() ?? "") : "";
}

function resolvePrice(text: string): string {
  const match = /Base price USD:\s*(.+)/i.exec(text) ?? /Variant price USD:\s*(.+)/i.exec(text);
  return match ? (match[1]?.trim() ?? "") : "";
}

// ---------------------------------------------------------------------------
// Guardrailed system prompt — keeps AI strictly in shopping mode
// ---------------------------------------------------------------------------
export const GLOBAL_SEARCH_SYSTEM_PROMPT = `You are "Ask Coolhat", a product discovery assistant for the Coolhat platform.
Your ONLY job is to help users find products from SME stores registered on Coolhat.

STRICT RULES:
1. You ONLY discuss products, stores, prices, variants, and stock available on Coolhat.
2. If the user asks ANYTHING unrelated to shopping or product discovery (e.g., coding help, general knowledge, creative writing), you MUST refuse. Reply politely: "I'm your Coolhat Shopping Assistant. I can only help you discover products from our SME stores!"
3. NEVER make up products. ONLY recommend products found in the search results provided to you.
4. When recommending products, ALWAYS include the store name and a clickable store link using markdown: [Store Name](URL)
5. Format product suggestions clearly with: product name, price (if available), category (if available), and store link.
6. If no products match the query, say so honestly and suggest the user try a different search.
7. You respond in English unless the user writes in Khmer, in which case you respond in Khmer.
8. Keep responses concise and buyer-friendly.`;
