import { and, eq, ilike, inArray, or } from "drizzle-orm";
import { db } from "../db";
import { chatMessages, chatSessions, productVariants, products } from "../db/schema";
import { env } from "../env";
import { ragService } from "./rag.service";

type AskAssistantInput = {
  tenantId: string;
  question: string;
  language?: string | null;
  sessionId?: string | null;
  anonymousId?: string | null;
};

function detectLanguage(text: string): "km" | "en" {
  return /[\u1780-\u17FF]/.test(text) ? "km" : "en";
}

function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function confidenceScore(matches: any[]): number {
  const top = matches[0];
  const score = typeof top?.score === "number" ? top.score : 0;
  return Number.isFinite(score) ? score : 0;
}

async function resolveOrCreateSession(input: {
  tenantId: string;
  sessionId?: string | null;
  language: string;
  anonymousId?: string | null;
}) {
  if (input.sessionId) {
    const existing = await db.query.chatSessions.findFirst({
      where: and(eq(chatSessions.id, input.sessionId), eq(chatSessions.tenantId, input.tenantId)),
    });
    if (existing) return existing;
  }

  const inserted = await db
    .insert(chatSessions)
    .values({
      tenantId: input.tenantId,
      channel: "web",
      language: input.language,
      anonymousId: input.anonymousId ?? null,
    })
    .returning();

  return inserted[0];
}

async function buildLiveFacts(tenantId: string, ragMatches: any[], question: string) {
  const productIdSet = new Set<string>();
  for (const match of ragMatches) {
    const metadata = (match?.metadata ?? {}) as Record<string, unknown>;
    const entityType = toText(metadata.entityType);
    if (entityType === "product") {
      const entityId = toText(metadata.entityId);
      if (entityId) productIdSet.add(entityId);
    } else if (entityType === "product_variant") {
      const productId = toText(metadata.productId);
      if (productId) productIdSet.add(productId);
    }
  }

  const productIds = Array.from(productIdSet).slice(0, 8);
  let relevantProducts =
    productIds.length > 0
      ? await db.query.products.findMany({
          where: and(eq(products.tenantId, tenantId), inArray(products.id, productIds)),
        })
      : [];

  if (relevantProducts.length === 0) {
    const keywords = question
      .split(/\s+/)
      .map((v) => v.trim())
      .filter((v) => v.length >= 3)
      .slice(0, 3);

    const textFilter =
      keywords.length > 0
        ? or(
            ...keywords.map((kw) =>
              or(ilike(products.name, `%${kw}%`), ilike(products.category, `%${kw}%`), ilike(products.description, `%${kw}%`))
            )
          )
        : undefined;

    relevantProducts = await db.query.products.findMany({
      where: and(eq(products.tenantId, tenantId), eq(products.isActive, true), textFilter),
      limit: 8,
    });
  }

  const liveProductIds = relevantProducts.map((p) => p.id);
  const variantRows =
    liveProductIds.length > 0
      ? await db.query.productVariants.findMany({
          where: and(eq(productVariants.tenantId, tenantId), inArray(productVariants.productId, liveProductIds)),
        })
      : [];

  const variantsByProduct = new Map<string, typeof variantRows>();
  for (const variant of variantRows) {
    const list = variantsByProduct.get(variant.productId) ?? [];
    list.push(variant);
    variantsByProduct.set(variant.productId, list);
  }

  const lines: string[] = [];
  for (const product of relevantProducts) {
    lines.push(
      `Product: ${product.name} | Active: ${product.isActive ? "yes" : "no"} | Base price USD: ${product.basePriceUsd} | Base price KHR: ${product.basePriceKhr} | Stock: ${product.stockQty}`
    );
    const variants = variantsByProduct.get(product.id) ?? [];
    for (const variant of variants.slice(0, 10)) {
      lines.push(
        `  Variant ${variant.id}: size=${variant.size ?? "-"}, color=${variant.color ?? "-"}, active=${variant.isActive ? "yes" : "no"}, price_usd=${variant.priceUsd ?? "-"}, price_khr=${variant.priceKhr ?? "-"}, stock=${variant.stockQty}`
      );
    }
  }

  return {
    lines,
    productCount: relevantProducts.length,
    variantCount: variantRows.length,
  };
}

async function generateAssistantAnswer(input: {
  question: string;
  language: "km" | "en";
  ragContextText: string;
  liveFactsText: string;
  lowConfidence: boolean;
}) {
  if (!env.OPEN_AI_API) {
    throw new Error("OPEN_AI_API is required for assistant answering.");
  }

  const prompt = `
You are a strict shop assistant AI.
Rules:
- Only answer about this shop's products, pricing, stock, variants, and usage.
- If question is out-of-scope, reply that you can only help with this shop.
- Prefer factual answers using Live Facts for stock/availability/price.
- If information is missing, say it clearly and do not invent.
- Respond in ${input.language === "km" ? "Khmer" : "English"}.
- Keep response concise and buyer-friendly.

Low confidence on retrieval: ${input.lowConfidence ? "yes" : "no"}

RAG Context:
${input.ragContextText || "(none)"}

Live Facts:
${input.liveFactsText || "(none)"}

Buyer question:
${input.question}
`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPEN_AI_API}`,
    },
    body: JSON.stringify({
      model: env.OPEN_AI_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    }),
  });

  const raw = await res.text();
  if (!res.ok) throw new Error(`Assistant generation failed: ${raw}`);

  const parsed = JSON.parse(raw);
  const content = parsed?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("Assistant generated empty response.");
  }

  return content.trim();
}

export async function askBuyerAssistant(input: AskAssistantInput) {
  const question = input.question.trim();
  const language = (input.language ? toText(input.language) : "") || detectLanguage(question);
  const resolvedLanguage = language === "en" ? "en" : "km";

  const session = await resolveOrCreateSession({
    tenantId: input.tenantId,
    sessionId: input.sessionId,
    language: resolvedLanguage,
    anonymousId: input.anonymousId,
  });

  await db.insert(chatMessages).values({
    tenantId: input.tenantId,
    sessionId: session.id,
    role: "user",
    content: question,
  });

  const ragMatches = await ragService.searchTenant(input.tenantId, question, 10);
  const topConfidence = confidenceScore(ragMatches as any[]);
  const lowConfidence = topConfidence < 0.78;

  const ragContextText = (ragMatches as any[])
    .slice(0, 6)
    .map((match, i) => {
      const metadata = (match?.metadata ?? {}) as Record<string, unknown>;
      const text = toText(metadata.text);
      const score = typeof match?.score === "number" ? match.score.toFixed(3) : "0.000";
      return `#${i + 1} score=${score}\n${text}`;
    })
    .join("\n\n");

  const liveFacts = await buildLiveFacts(input.tenantId, ragMatches as any[], question);
  const liveFactsText = liveFacts.lines.join("\n");

  const answer = await generateAssistantAnswer({
    question,
    language: resolvedLanguage,
    ragContextText,
    liveFactsText,
    lowConfidence,
  });

  await db.insert(chatMessages).values({
    tenantId: input.tenantId,
    sessionId: session.id,
    role: "assistant",
    content: answer,
  });

  if (lowConfidence) {
    await db.insert(chatMessages).values({
      tenantId: input.tenantId,
      sessionId: session.id,
      role: "system",
      content: `LOW_CONFIDENCE score=${toNumber(topConfidence).toFixed(3)} question=${question}`,
    });
  }

  return {
    sessionId: session.id,
    answer,
    language: resolvedLanguage,
    confidence: topConfidence,
    lowConfidence,
    sources: {
      ragMatches: (ragMatches as any[]).length,
      liveProducts: liveFacts.productCount,
      liveVariants: liveFacts.variantCount,
    },
  };
}
