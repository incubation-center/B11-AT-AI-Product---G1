import { and, desc, eq, or } from "drizzle-orm";
import { db } from "../db";
import { productDrafts, productKnowledge, products, productVariants } from "../db/schema";
import { env } from "../env";
import { ragService } from "./rag.service";
import { createProduct, createVariant } from "./product.service";

type DraftLanguage = "km" | "en";

type DraftQuestion = {
  question: string;
  lang: DraftLanguage;
  askedAt: string;
};

type DraftAnswer = {
  answer: string;
  lang: DraftLanguage;
  answeredAt: string;
};

type DraftVariant = {
  size?: string | null;
  color?: string | null;
  price_usd?: string | number | null;
  price_khr?: string | number | null;
  stock_qty?: number | null;
  low_stock_threshold?: number | null;
};

type DraftFinalPayload = {
  description: string;
  usage: string;
  suitability: string;
  key_specs_or_ingredients: string;
  faqs: string[];
  variants?: DraftVariant[];
};

const MAX_FOLLOW_UP_QUESTIONS = 5;
type ProductDomain = "electronics" | "beauty" | "fashion" | "food" | "home" | "general";

function parseDraftLanguage(input: unknown): DraftLanguage | null {
  if (typeof input !== "string") return null;
  const value = input.trim().toLowerCase();
  if (value === "en" || value === "english") return "en";
  if (value === "km" || value === "kh" || value === "khmer") return "km";
  return null;
}

function normalizeLang(input: unknown): DraftLanguage {
  return parseDraftLanguage(input) ?? "km";
}

function detectLangFromText(text: string): DraftLanguage {
  return /[\u1780-\u17FF]/.test(text) ? "km" : "en";
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asNumericString(value: unknown, fallback = "0"): string {
  if (typeof value === "number" && Number.isFinite(value)) return `${value}`;
  if (typeof value === "string" && value.trim()) {
    const trimmed = value.trim();
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) return trimmed;
  }
  return fallback;
}

function asInteger(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && /^-?\d+$/.test(value.trim())) {
    return Number.parseInt(value.trim(), 10);
  }
  return fallback;
}

function parseJsonText(input: string): any {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("```")) {
    const cleaned = trimmed.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
    return JSON.parse(cleaned);
  }
  return JSON.parse(trimmed);
}

function isValidFinalPayload(input: any): input is DraftFinalPayload {
  return (
    input &&
    typeof input === "object" &&
    asString(input.description).length > 0 &&
    asString(input.usage).length > 0 &&
    asString(input.suitability).length > 0 &&
    asString(input.key_specs_or_ingredients).length > 0 &&
    Array.isArray(input.faqs) &&
    input.faqs.length > 0 &&
    input.faqs.every((v: unknown) => asString(v).length > 0)
  );
}

function readQuestions(value: unknown): DraftQuestion[] {
  return Array.isArray(value) ? (value as DraftQuestion[]) : [];
}

function readAnswers(value: unknown): DraftAnswer[] {
  return Array.isArray(value) ? (value as DraftAnswer[]) : [];
}

function detectProductDomain(initialInput: unknown): ProductDomain {
  const data = (initialInput ?? {}) as Record<string, unknown>;
  const text = `${asString(data.category)} ${asString(data.name)}`.toLowerCase();

  if (/(phone|smartphone|laptop|tablet|earbud|headphone|camera|monitor|charger|power bank|ssd|ram|keyboard|mouse|tv|router|electronic|electronics)/.test(text)) {
    return "electronics";
  }
  if (/(skincare|serum|cream|cleanser|toner|sunscreen|makeup|lipstick|beauty|cosmetic|fragrance)/.test(text)) {
    return "beauty";
  }
  if (/(shirt|t-shirt|dress|pants|jeans|shoe|sneaker|fashion|clothing|hoodie|jacket|bag)/.test(text)) {
    return "fashion";
  }
  if (/(food|snack|drink|beverage|coffee|tea|sauce|noodle|rice|cookie|chocolate)/.test(text)) {
    return "food";
  }
  if (/(furniture|sofa|chair|table|lamp|kitchen|home|mattress|blanket|pillow|decor)/.test(text)) {
    return "home";
  }
  return "general";
}

function getDomainGuidance(domain: ProductDomain): { focus: string; variantHints: string } {
  switch (domain) {
    case "electronics":
      return {
        focus: "Focus on technical specs, compatibility, performance, warranty, and safety.",
        variantHints: "Typical variants: storage/RAM tier, color, region plug type, bundle options.",
      };
    case "beauty":
      return {
        focus: "Focus on skin/hair concerns, ingredients, usage routine, safety notes, and expected results.",
        variantHints: "Typical variants: size (ml/g), formula type, scent, shade/tone.",
      };
    case "fashion":
      return {
        focus: "Focus on fit, material, comfort, style use-case, and care instructions.",
        variantHints: "Typical variants: size, color, fit/cut, material option.",
      };
    case "food":
      return {
        focus: "Focus on flavor profile, ingredients/allergens, serving method, and storage.",
        variantHints: "Typical variants: pack size, flavor, spicy level, quantity bundle.",
      };
    case "home":
      return {
        focus: "Focus on dimensions, material, durability, installation/setup, and maintenance.",
        variantHints: "Typical variants: size, color/finish, material grade, set quantity.",
      };
    default:
      return {
        focus: "Focus on core value, usage, suitability, and key distinguishing specs.",
        variantHints: "Typical variants: size, color, package tier, or feature tier.",
      };
  }
}

function buildDraftPrompt(input: {
  preferredLang: DraftLanguage;
  initialInput: unknown;
  questions: DraftQuestion[];
  answers: DraftAnswer[];
  maxFollowUpQuestions: number;
  forceFinalize: boolean;
}) {
  const domain = detectProductDomain(input.initialInput);
  const domainGuidance = getDomainGuidance(domain);

  return `
You are an expert shop assistant trainer for a Cambodian storefront.
You must ask exactly ONE follow-up question at a time unless information is sufficient.
Language policy:
- Prefer Khmer when preferredLang is "km"
- Prefer English when preferredLang is "en"

You must return ONLY valid JSON:
{
  "detected_language": "km" | "en",
  "is_ready": boolean,
  "next_question": string | null,
  "final_payload": {
    "description": string,
    "usage": string,
    "suitability": string,
    "key_specs_or_ingredients": string,
    "faqs": string[],
    "variants": [
      {
        "size": string | null,
        "color": string | null,
        "price_usd": string | null,
        "price_khr": string | null,
        "stock_qty": number | null,
        "low_stock_threshold": number | null
      }
    ]
  } | null
}

Rules:
- Ask only one concise question when is_ready is false.
- final_payload must be complete only when is_ready is true.
- Keep faqs practical for customer support.
- Include variant list only if relevant.
- Ask high-value questions only, prioritizing missing details that most improve product knowledge.
- Target coverage quality across: product benefit, usage, suitability, key ingredients/specs, and variant/stock differences.
- Product domain is "${domain}". Ask ONLY domain-relevant questions.
- Domain focus: ${domainGuidance.focus}
- Variant guidance: ${domainGuidance.variantHints}
- Prefer asking one question that combines missing variant details in one shot when possible.
- Do not ask more than max_follow_up_questions total.
- If questions_asked_so_far >= max_follow_up_questions or force_finalize is true:
  - Set "is_ready": true
  - Set "next_question": null
  - Return the best complete "final_payload" possible from available context and reasonable assumptions.

Context:
preferredLang: ${input.preferredLang}
initialInput: ${JSON.stringify(input.initialInput)}
questions: ${JSON.stringify(input.questions)}
answers: ${JSON.stringify(input.answers)}
questions_asked_so_far: ${input.questions.length}
max_follow_up_questions: ${input.maxFollowUpQuestions}
force_finalize: ${input.forceFinalize}
`;
}

async function askOpenAIDraftQuestion(input: {
  preferredLang: DraftLanguage;
  initialInput: unknown;
  questions: DraftQuestion[];
  answers: DraftAnswer[];
  maxFollowUpQuestions: number;
  forceFinalize: boolean;
}) {
  if (!env.OPEN_AI_API) {
    throw new Error("OPEN_AI_API is required for AI draft flow.");
  }

  const prompt = buildDraftPrompt(input);
  const model = env.OPEN_AI_MODEL;

  const response = await fetch(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPEN_AI_API}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        response_format: {
          type: "json_object",
        },
      }),
    }
  );

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`OpenAI request failed: ${raw}`);
  }

  let parsed: any;
  try {
    const envelope = JSON.parse(raw);
    const text = envelope?.choices?.[0]?.message?.content;
    if (typeof text !== "string" || !text.trim()) {
      throw new Error("No text response from OpenAI.");
    }
    parsed = parseJsonText(text);
  } catch (error) {
    throw new Error(`Unable to parse OpenAI response: ${error instanceof Error ? error.message : "unknown error"}`);
  }

  const detectedLanguage = normalizeLang(parsed?.detected_language ?? input.preferredLang);
  const isReady = Boolean(parsed?.is_ready);
  const nextQuestion = typeof parsed?.next_question === "string" ? parsed.next_question.trim() : null;
  const finalPayload = parsed?.final_payload ?? null;

  return {
    detectedLanguage,
    isReady,
    nextQuestion,
    finalPayload,
  };
}

function composeProductDescription(finalPayload: DraftFinalPayload): string {
  const faqText = finalPayload.faqs.map((faq, i) => `Q${i + 1}: ${faq}`).join("\n");
  return [
    finalPayload.description,
    `Usage: ${finalPayload.usage}`,
    `Suitability: ${finalPayload.suitability}`,
    `Specs/Ingredients: ${finalPayload.key_specs_or_ingredients}`,
    faqText ? `FAQs:\n${faqText}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

async function upsertProductKnowledgeFromDraft(
  tenantId: string,
  productId: string,
  lang: DraftLanguage,
  draft: typeof productDrafts.$inferSelect,
  finalPayload: DraftFinalPayload
) {
  const faqs = finalPayload.faqs.map((faq) => asString(faq)).filter(Boolean);
  const questions = readQuestions(draft.questions);
  const answers = readAnswers(draft.answers);

  const payload =
    lang === "km"
      ? {
          overviewKm: asString(finalPayload.description),
          usageKm: asString(finalPayload.usage),
          suitabilityKm: asString(finalPayload.suitability),
          keySpecsKm: asString(finalPayload.key_specs_or_ingredients),
          faqsKm: faqs,
        }
      : {
          overviewEn: asString(finalPayload.description),
          usageEn: asString(finalPayload.usage),
          suitabilityEn: asString(finalPayload.suitability),
          keySpecsEn: asString(finalPayload.key_specs_or_ingredients),
          faqsEn: faqs,
        };

  const existing = await db.query.productKnowledge.findFirst({
    where: and(eq(productKnowledge.tenantId, tenantId), eq(productKnowledge.productId, productId)),
    columns: { id: true },
  });

  const patch = {
    tenantId,
    productId,
    ...payload,
    qaHistory: {
      questions,
      answers,
    },
    readinessStatus: "ready",
    missingFields: null,
    updatedAt: new Date(),
  };

  if (!existing) {
    await db.insert(productKnowledge).values({
      ...patch,
      createdAt: new Date(),
    });
    return;
  }

  await db
    .update(productKnowledge)
    .set(patch)
    .where(and(eq(productKnowledge.id, existing.id), eq(productKnowledge.tenantId, tenantId)));
}

export async function startProductDraft(
  tenantId: string,
  input: {
    lang?: unknown;
    product_id?: unknown;
    name?: string;
    description?: unknown;
    base_price_usd?: unknown;
    base_price_khr?: unknown;
    category?: unknown;
    has_variants?: unknown;
    track_inventory?: unknown;
    stock_qty?: unknown;
    low_stock_threshold?: unknown;
    variants?: unknown;
    image_urls?: unknown;
  }
) {
  const linkedProductId = asString(input.product_id);

  let normalizedInitialInput: Record<string, unknown>;
  if (linkedProductId) {
    const product = await db.query.products.findFirst({
      where: and(eq(products.id, linkedProductId), eq(products.tenantId, tenantId)),
    });
    if (!product) throw new Error("Product not found");

    const variants = await db.query.productVariants.findMany({
      where: and(eq(productVariants.productId, product.id), eq(productVariants.tenantId, tenantId)),
    });

    normalizedInitialInput = {
      product_id: product.id,
      name: product.name,
      description: product.description,
      category: product.category,
      base_price_usd: asNumericString(product.basePriceUsd, "0"),
      base_price_khr: asNumericString(product.basePriceKhr, "0"),
      track_inventory: product.trackInventory,
      stock_qty: product.stockQty,
      low_stock_threshold: product.lowStockThreshold,
      has_variants: product.hasVariants,
      variants: variants.map((variant) => ({
        id: variant.id,
        size: variant.size,
        color: variant.color,
        price_usd: variant.priceUsd,
        price_khr: variant.priceKhr,
        stock_qty: variant.stockQty,
        low_stock_threshold: variant.lowStockThreshold,
        is_active: variant.isActive,
      })),
    };
  } else {
    const name = asString(input.name);
    if (!name) {
      throw new Error("name is required");
    }
    normalizedInitialInput = {
      name,
      description: asString(input.description) || null,
      base_price_usd: asNumericString(input.base_price_usd, "0"),
      base_price_khr: asNumericString(input.base_price_khr, "0"),
      category: asString(input.category) || null,
      has_variants: Boolean(input.has_variants),
      track_inventory: typeof input.track_inventory === "boolean" ? input.track_inventory : true,
      stock_qty: asInteger(input.stock_qty, 0),
      low_stock_threshold: asInteger(input.low_stock_threshold, 5),
      variants: Array.isArray(input.variants) ? input.variants : [],
      image_urls: Array.isArray(input.image_urls)
        ? input.image_urls.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
        : [],
    };
  }

  const explicitLang = parseDraftLanguage(input.lang);
  const detectedLang = detectLangFromText(
    [
      asString(normalizedInitialInput.name),
      asString(normalizedInitialInput.description),
      asString(normalizedInitialInput.category),
    ]
      .filter(Boolean)
      .join(" ")
  );
  const lang = explicitLang ?? detectedLang;

  const inserted = await db
    .insert(productDrafts)
    .values({
      tenantId,
      status: "questioning",
      lang,
      initialInput: normalizedInitialInput,
      questions: [],
      answers: [],
      finalPayload: null,
      indexStatus: "pending",
      indexAttempts: 0,
      indexError: null,
      indexedAt: null,
    })
    .returning();

  const draft = inserted[0];
  const ai = await askOpenAIDraftQuestion({
    preferredLang: lang,
    initialInput: draft.initialInput,
    questions: [],
    answers: [],
    maxFollowUpQuestions: MAX_FOLLOW_UP_QUESTIONS,
    forceFinalize: false,
  });

  const now = new Date().toISOString();
  const questions = ai.nextQuestion
    ? [{ question: ai.nextQuestion, lang: ai.detectedLanguage, askedAt: now } satisfies DraftQuestion]
    : [];

  const canFinalize = ai.isReady && isValidFinalPayload(ai.finalPayload);
  const updated = await db
    .update(productDrafts)
    .set({
      lang: ai.detectedLanguage,
      status: canFinalize ? "ready" : "questioning",
      questions,
      finalPayload: canFinalize ? ai.finalPayload : null,
      updatedAt: new Date(),
    })
    .where(and(eq(productDrafts.id, draft.id), eq(productDrafts.tenantId, tenantId)))
    .returning();

  return {
    draft: updated[0],
    nextQuestion: canFinalize ? null : ai.nextQuestion,
  };
}

export async function answerProductDraft(tenantId: string, input: { draftId: string; answer: string }) {
  const draft = await db.query.productDrafts.findFirst({
    where: and(eq(productDrafts.id, input.draftId), eq(productDrafts.tenantId, tenantId)),
  });

  if (!draft) return { draft: null, nextQuestion: null, message: "Draft not found" };
  if (draft.status === "confirmed" || draft.status === "cancelled") {
    return { draft: null, nextQuestion: null, message: "Draft is already finalized" };
  }

  const questions = readQuestions(draft.questions);
  const answers = [
    ...readAnswers(draft.answers),
    {
      answer: input.answer.trim(),
      lang: detectLangFromText(input.answer),
      answeredAt: new Date().toISOString(),
    } satisfies DraftAnswer,
  ];

  const preferredLang = answers[answers.length - 1]?.lang ?? normalizeLang(draft.lang);
  const forceFinalize = questions.length >= MAX_FOLLOW_UP_QUESTIONS;
  const ai = await askOpenAIDraftQuestion({
    preferredLang,
    initialInput: draft.initialInput,
    questions,
    answers,
    maxFollowUpQuestions: MAX_FOLLOW_UP_QUESTIONS,
    forceFinalize,
  });

  const canFinalize = ai.isReady && isValidFinalPayload(ai.finalPayload);
  const canAskMore = questions.length < MAX_FOLLOW_UP_QUESTIONS;
  const nextQuestions = canFinalize || !canAskMore
    ? questions
    : [
        ...questions,
        {
          question: ai.nextQuestion ?? "Please provide more details.",
          lang: ai.detectedLanguage,
          askedAt: new Date().toISOString(),
        } satisfies DraftQuestion,
      ];

  const updated = await db
    .update(productDrafts)
    .set({
      lang: ai.detectedLanguage,
      status: canFinalize ? "ready" : "questioning",
      questions: nextQuestions,
      answers,
      finalPayload: canFinalize ? ai.finalPayload : null,
      updatedAt: new Date(),
    })
    .where(and(eq(productDrafts.id, draft.id), eq(productDrafts.tenantId, tenantId)))
    .returning();

  return {
    draft: updated[0] ?? null,
    nextQuestion: canFinalize || !canAskMore ? null : nextQuestions[nextQuestions.length - 1]?.question ?? null,
    message: canFinalize || canAskMore ? null : "Reached max 5 follow-up questions. Please confirm the draft.",
  };
}

export async function confirmProductDraft(tenantId: string, input: { draftId: string }) {
  const draft = await db.query.productDrafts.findFirst({
    where: and(eq(productDrafts.id, input.draftId), eq(productDrafts.tenantId, tenantId)),
  });

  if (!draft) return { error: "Draft not found" as const };
  if (draft.status === "confirmed") return { error: "Draft already confirmed" as const };
  if (!isValidFinalPayload(draft.finalPayload)) return { error: "Draft is not ready for confirmation" as const };

  const initial = (draft.initialInput ?? {}) as Record<string, unknown>;
  const finalPayload = draft.finalPayload as DraftFinalPayload;
  const knowledgeLang = normalizeLang(draft.lang);
  const linkedProductId = asString(initial.product_id);

  if (linkedProductId) {
    const existingProduct = await db.query.products.findFirst({
      where: and(eq(products.id, linkedProductId), eq(products.tenantId, tenantId)),
    });
    if (!existingProduct) return { error: "Product not found" as const };

    await upsertProductKnowledgeFromDraft(tenantId, existingProduct.id, knowledgeLang, draft, finalPayload);

    const nextAttempts = (draft.indexAttempts ?? 0) + 1;
    let indexStatus: "indexed" | "pending" = "indexed";
    let indexError: string | null = null;
    let indexedAt: Date | null = new Date();

    try {
      await ragService.reindexProduct(tenantId, existingProduct.id);
    } catch (error) {
      indexStatus = "pending";
      indexedAt = null;
      indexError = error instanceof Error ? error.message.slice(0, 1000) : "Unknown indexing error";
    }

    await db
      .update(productDrafts)
      .set({
        status: "confirmed",
        finalPayload: {
          ...finalPayload,
          product_id: existingProduct.id,
        },
        indexStatus,
        indexError,
        indexAttempts: nextAttempts,
        indexedAt,
        updatedAt: new Date(),
      })
      .where(and(eq(productDrafts.id, draft.id), eq(productDrafts.tenantId, tenantId)));

    return {
      error: null,
      product: existingProduct,
      variants: [],
      index: {
        status: indexStatus,
        attempts: nextAttempts,
        error: indexError,
      },
    };
  }

  const variants = Array.isArray(finalPayload.variants) ? finalPayload.variants : [];

  const product = await createProduct(tenantId, {
    name: asString(initial.name) || "Untitled Product",
    category: asString(initial.category) || null,
    description: composeProductDescription(finalPayload),
    basePriceUsd: asNumericString(initial.base_price_usd, "0"),
    basePriceKhr: asNumericString(initial.base_price_khr, "0"),
    trackInventory: typeof initial.track_inventory === "boolean" ? initial.track_inventory : true,
    stockQty: asInteger(initial.stock_qty, 0),
    lowStockThreshold: asInteger(initial.low_stock_threshold, 5),
    hasVariants: typeof initial.has_variants === "boolean" ? initial.has_variants : variants.length > 0,
    imageUrls: Array.isArray(initial.image_urls)
      ? initial.image_urls.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      : [],
  });

  if (!product) return { error: "Unable to create product" as const };

  await upsertProductKnowledgeFromDraft(tenantId, product.id, knowledgeLang, draft, finalPayload);

  const createdVariants: any[] = [];
  const dedupe = new Set<string>();
  for (const variant of variants) {
    const key = `${asString(variant.size) || ""}::${asString(variant.color) || ""}`;
    if (dedupe.has(key)) continue;
    dedupe.add(key);

    const created = await createVariant(tenantId, product.id, {
      size: asString(variant.size) || null,
      color: asString(variant.color) || null,
      priceUsd: variant.price_usd === null ? undefined : asNumericString(variant.price_usd, "0"),
      priceKhr: variant.price_khr === null ? undefined : asNumericString(variant.price_khr, "0"),
      stockQty: asInteger(variant.stock_qty, 0),
      lowStockThreshold: asInteger(variant.low_stock_threshold, 5),
      isActive: true,
    });
    if (created) createdVariants.push(created);
  }

  const nextAttempts = (draft.indexAttempts ?? 0) + 1;
  let indexStatus: "indexed" | "pending" = "indexed";
  let indexError: string | null = null;
  let indexedAt: Date | null = new Date();

  try {
    await ragService.reindexProduct(tenantId, product.id);
  } catch (error) {
    indexStatus = "pending";
    indexedAt = null;
    indexError = error instanceof Error ? error.message.slice(0, 1000) : "Unknown indexing error";
  }

  await db
    .update(productDrafts)
    .set({
      status: "confirmed",
      finalPayload: {
        ...finalPayload,
        product_id: product.id,
        variant_ids: createdVariants.map((v) => v.id),
      },
      indexStatus,
      indexError,
      indexAttempts: nextAttempts,
      indexedAt,
      updatedAt: new Date(),
    })
    .where(and(eq(productDrafts.id, draft.id), eq(productDrafts.tenantId, tenantId)));

  return {
    error: null,
    product,
    variants: createdVariants,
    index: {
      status: indexStatus,
      attempts: nextAttempts,
      error: indexError,
    },
  };
}

export async function listActiveProductDrafts(tenantId: string) {
  return db.query.productDrafts.findMany({
    where: and(
      eq(productDrafts.tenantId, tenantId),
      or(eq(productDrafts.status, "draft"), eq(productDrafts.status, "questioning"), eq(productDrafts.status, "ready"))
    ),
    orderBy: [desc(productDrafts.updatedAt)],
  });
}

export async function getProductDraftById(tenantId: string, draftId: string) {
  return db.query.productDrafts.findFirst({
    where: and(eq(productDrafts.id, draftId), eq(productDrafts.tenantId, tenantId)),
  });
}
