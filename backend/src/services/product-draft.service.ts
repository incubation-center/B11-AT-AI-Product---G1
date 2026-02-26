import { and, desc, eq, or } from "drizzle-orm";
import { db } from "../db";
import { productDrafts } from "../db/schema";
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

function normalizeLang(input: unknown): DraftLanguage {
  return input === "en" ? "en" : "km";
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

function buildDraftPrompt(input: {
  preferredLang: DraftLanguage;
  initialInput: unknown;
  questions: DraftQuestion[];
  answers: DraftAnswer[];
}) {
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

Context:
preferredLang: ${input.preferredLang}
initialInput: ${JSON.stringify(input.initialInput)}
questions: ${JSON.stringify(input.questions)}
answers: ${JSON.stringify(input.answers)}
`;
}

async function askGeminiDraftQuestion(input: {
  preferredLang: DraftLanguage;
  initialInput: unknown;
  questions: DraftQuestion[];
  answers: DraftAnswer[];
}) {
  if (!env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is required for AI draft flow.");
  }

  const prompt = buildDraftPrompt(input);
  const model = "gemini-2.0-flash";

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
        },
      }),
    }
  );

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`Gemini request failed: ${raw}`);
  }

  let parsed: any;
  try {
    const envelope = JSON.parse(raw);
    const text = envelope?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== "string" || !text.trim()) {
      throw new Error("No text response from Gemini.");
    }
    parsed = parseJsonText(text);
  } catch (error) {
    throw new Error(`Unable to parse Gemini response: ${error instanceof Error ? error.message : "unknown error"}`);
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

export async function startProductDraft(
  tenantId: string,
  input: { lang?: unknown; name: string; base_price_usd: unknown; base_price_khr: unknown; category?: unknown }
) {
  const lang = normalizeLang(input.lang);
  const inserted = await db
    .insert(productDrafts)
    .values({
      tenantId,
      status: "questioning",
      lang,
      initialInput: {
        name: input.name.trim(),
        base_price_usd: asNumericString(input.base_price_usd, "0"),
        base_price_khr: asNumericString(input.base_price_khr, "0"),
        category: asString(input.category) || null,
      },
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
  const ai = await askGeminiDraftQuestion({
    preferredLang: lang,
    initialInput: draft.initialInput,
    questions: [],
    answers: [],
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
  const ai = await askGeminiDraftQuestion({
    preferredLang,
    initialInput: draft.initialInput,
    questions,
    answers,
  });

  const canFinalize = ai.isReady && isValidFinalPayload(ai.finalPayload);
  const nextQuestions = canFinalize
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
    nextQuestion: canFinalize ? null : nextQuestions[nextQuestions.length - 1]?.question ?? null,
    message: null,
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
  const variants = Array.isArray(finalPayload.variants) ? finalPayload.variants : [];

  const product = await createProduct(tenantId, {
    name: asString(initial.name) || "Untitled Product",
    category: asString(initial.category) || null,
    description: composeProductDescription(finalPayload),
    basePriceUsd: asNumericString(initial.base_price_usd, "0"),
    basePriceKhr: asNumericString(initial.base_price_khr, "0"),
    hasVariants: variants.length > 0,
  });

  if (!product) return { error: "Unable to create product" as const };

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
    await ragService.indexProduct(tenantId, product.id);
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
