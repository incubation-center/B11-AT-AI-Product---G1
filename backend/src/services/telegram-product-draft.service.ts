import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { productDrafts, telegramProductDraftSessions } from "../db/schema";
import { uploadTelegramDraftImageToCloudinary } from "../lib/cloudinary";
import {
  answerProductDraft,
  confirmProductDraft,
  getProductDraftById,
  startProductDraft,
} from "./product-draft.service";

type DraftLanguage = "km" | "en";
type SessionStage =
  | "awaiting_name"
  | "awaiting_description"
  | "awaiting_category"
  | "awaiting_price_usd"
  | "awaiting_price_khr"
  | "awaiting_track_inventory"
  | "awaiting_stock_qty"
  | "awaiting_low_stock_threshold"
  | "awaiting_has_variants"
  | "awaiting_image_urls"
  | "answering"
  | "ready";

type SeedInput = {
  name?: string;
  description?: string | null;
  category?: string | null;
  base_price_usd?: string;
  base_price_khr?: string;
  track_inventory?: boolean;
  stock_qty?: number;
  low_stock_threshold?: number;
  has_variants?: boolean;
  image_urls?: string[];
};

const MAX_TELEGRAM_DRAFT_IMAGES = 3;

function detectLangFromText(text: string): DraftLanguage {
  return /[\u1780-\u17FF]/.test(text) ? "km" : "en";
}

function cleanText(value: string): string {
  return value.trim();
}

function isNumericText(value: string): boolean {
  const normalized = value.trim();
  if (!normalized) return false;
  const parsed = Number(normalized);
  return Number.isFinite(parsed);
}

function isIntegerText(value: string): boolean {
  return /^-?\d+$/.test(value.trim());
}

function parseBooleanInput(value: string): boolean | null {
  const normalized = value.trim().toLowerCase();
  if (["true", "yes", "y", "1"].includes(normalized)) return true;
  if (["false", "no", "n", "0"].includes(normalized)) return false;
  return null;
}

function parseImageUrls(value: string): string[] | null {
  const trimmed = value.trim();
  if (!trimmed) return [];

  const urls = trimmed
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);

  for (const url of urls) {
    try {
      new URL(url);
    } catch {
      return null;
    }
  }

  if (urls.length > MAX_TELEGRAM_DRAFT_IMAGES) {
    return null;
  }

  return urls;
}

function canSkip(stage: SessionStage): boolean {
  return stage === "awaiting_description" || stage === "awaiting_category" || stage === "awaiting_image_urls";
}

function formatSeedPrompt(stage: SessionStage): string {
  switch (stage) {
    case "awaiting_name":
      return "Send the product name.";
    case "awaiting_description":
      return "Send the product description. Send /skip if you want it empty.";
    case "awaiting_category":
      return "Send the product category. Example: Skincare. Send /skip if you want it empty.";
    case "awaiting_price_usd":
      return "Send the base price in USD. Example: 12.5";
    case "awaiting_price_khr":
      return "Send the base price in KHR. Example: 50000";
    case "awaiting_track_inventory":
      return "Track inventory? Send yes or no.";
    case "awaiting_stock_qty":
      return "Send the stock quantity as an integer. Example: 10";
    case "awaiting_low_stock_threshold":
      return "Send the low stock threshold as an integer. Example: 5";
    case "awaiting_has_variants":
      return "Does this product have variants? Send yes or no.";
    case "awaiting_image_urls":
      return "Send up to 3 image URL(s), separated by commas, or upload an image here in Telegram. Send /skip for none.";
    case "answering":
      return "Reply with the answer to the current product question. Use /cancel to stop.";
    case "ready":
      return "Draft is ready. Send /confirm to create the product or /cancel to discard it.";
  }
}

async function saveSession(input: {
  telegramUserId: number;
  tenantId: string;
  draftId?: string | null;
  stage: SessionStage;
  lang: DraftLanguage;
  seedInput: SeedInput;
}) {
  const existing = await db.query.telegramProductDraftSessions.findFirst({
    where: eq(telegramProductDraftSessions.telegramUserId, input.telegramUserId),
  });

  if (!existing) {
    await db.insert(telegramProductDraftSessions).values({
      telegramUserId: input.telegramUserId,
      tenantId: input.tenantId,
      draftId: input.draftId ?? null,
      stage: input.stage,
      lang: input.lang,
      seedInput: input.seedInput,
    });
    return;
  }

  await db
    .update(telegramProductDraftSessions)
    .set({
      tenantId: input.tenantId,
      draftId: input.draftId ?? null,
      stage: input.stage,
      lang: input.lang,
      seedInput: input.seedInput,
      updatedAt: new Date(),
    })
    .where(eq(telegramProductDraftSessions.telegramUserId, input.telegramUserId));
}

async function deleteSession(telegramUserId: number) {
  await db
    .delete(telegramProductDraftSessions)
    .where(eq(telegramProductDraftSessions.telegramUserId, telegramUserId));
}

async function moveToStage(
  tenantId: string,
  telegramUserId: number,
  draftId: string | null | undefined,
  lang: DraftLanguage,
  seedInput: SeedInput,
  stage: SessionStage
) {
  await saveSession({
    telegramUserId,
    tenantId,
    draftId: draftId ?? null,
    stage,
    lang,
    seedInput,
  });
  return formatSeedPrompt(stage);
}

export async function startTelegramProductDraft(tenantId: string, telegramUserId: number, initialText?: string) {
  const existing = await db.query.telegramProductDraftSessions.findFirst({
    where: eq(telegramProductDraftSessions.telegramUserId, telegramUserId),
  });

  if (existing) {
    if (existing.stage === "ready") {
      return "A product draft is already ready. Send /confirm to create it or /cancel to discard it.";
    }

    return `A product draft is already in progress.\n\n${formatSeedPrompt(existing.stage as SessionStage)}`;
  }

  const lang = detectLangFromText(initialText ?? "");
  await saveSession({
    telegramUserId,
    tenantId,
    stage: "awaiting_name",
    lang,
    seedInput: {},
  });

  return [
    "Starting Telegram product draft.",
    "This collects the same core fields as the product endpoint before the AI follow-up flow starts.",
    "Use /skip for optional fields like description, category, or image URLs.",
    "Send /cancel anytime to stop.",
    "",
    formatSeedPrompt("awaiting_name"),
  ].join("\n");
}

async function beginAiDraftFromSeed(
  tenantId: string,
  telegramUserId: number,
  lang: DraftLanguage,
  seedInput: SeedInput
) {
  const result = await startProductDraft(tenantId, {
    lang,
    name: seedInput.name,
    description: seedInput.description,
    category: seedInput.category,
    base_price_usd: seedInput.base_price_usd,
    base_price_khr: seedInput.base_price_khr,
    track_inventory: seedInput.track_inventory,
    stock_qty: seedInput.stock_qty,
    low_stock_threshold: seedInput.low_stock_threshold,
    has_variants: seedInput.has_variants,
    variants: [],
    image_urls: seedInput.image_urls,
  } as any);

  const stage: SessionStage = result.nextQuestion ? "answering" : "ready";
  await saveSession({
    telegramUserId,
    tenantId,
    draftId: result.draft?.id ?? null,
    stage,
    lang,
    seedInput,
  });

  if (!result.draft?.id) {
    return "Unable to start product draft.";
  }

  if (result.nextQuestion) {
    return `${result.nextQuestion}\n\nReply with your answer. Use /confirm when the draft is ready, or /cancel to stop.`;
  }

  return "Draft is ready. Send /confirm to create the product or /cancel to discard it.";
}

export async function handleTelegramSkip(tenantId: string, telegramUserId: number) {
  const session = await db.query.telegramProductDraftSessions.findFirst({
    where: eq(telegramProductDraftSessions.telegramUserId, telegramUserId),
  });

  if (!session || session.tenantId !== tenantId) {
    return "No Telegram product draft is in progress.";
  }

  const stage = session.stage as SessionStage;
  if (!canSkip(stage)) {
    return "This step cannot be skipped.";
  }

  const seedInput = { ...((session.seedInput ?? {}) as SeedInput) };
  const lang = session.lang as DraftLanguage;

  if (stage === "awaiting_description") {
    seedInput.description = null;
    return moveToStage(tenantId, telegramUserId, session.draftId, lang, seedInput, "awaiting_category");
  }

  if (stage === "awaiting_category") {
    seedInput.category = null;
    return moveToStage(tenantId, telegramUserId, session.draftId, lang, seedInput, "awaiting_price_usd");
  }

  seedInput.image_urls = [];
  return beginAiDraftFromSeed(tenantId, telegramUserId, lang, seedInput);
}

export async function handleTelegramProductDraftReply(tenantId: string, telegramUserId: number, text: string) {
  const session = await db.query.telegramProductDraftSessions.findFirst({
    where: eq(telegramProductDraftSessions.telegramUserId, telegramUserId),
  });

  if (!session || session.tenantId !== tenantId) {
    return null;
  }

  const answer = cleanText(text);
  if (!answer) {
    return formatSeedPrompt(session.stage as SessionStage);
  }

  const lang = detectLangFromText(answer);
  const seedInput = { ...((session.seedInput ?? {}) as SeedInput) };

  switch (session.stage as SessionStage) {
    case "awaiting_name":
      seedInput.name = answer;
      return moveToStage(tenantId, telegramUserId, session.draftId, lang, seedInput, "awaiting_description");
    case "awaiting_description":
      seedInput.description = answer;
      return moveToStage(tenantId, telegramUserId, session.draftId, lang, seedInput, "awaiting_category");
    case "awaiting_category":
      seedInput.category = answer;
      return moveToStage(tenantId, telegramUserId, session.draftId, lang, seedInput, "awaiting_price_usd");
    case "awaiting_price_usd":
      if (!isNumericText(answer)) {
        return "Base price USD must be a number. Example: 12.5";
      }
      seedInput.base_price_usd = answer;
      return moveToStage(tenantId, telegramUserId, session.draftId, lang, seedInput, "awaiting_price_khr");
    case "awaiting_price_khr":
      if (!isNumericText(answer)) {
        return "Base price KHR must be a number. Example: 50000";
      }
      seedInput.base_price_khr = answer;
      return moveToStage(tenantId, telegramUserId, session.draftId, lang, seedInput, "awaiting_track_inventory");
    case "awaiting_track_inventory": {
      const parsed = parseBooleanInput(answer);
      if (parsed === null) {
        return "Track inventory must be yes or no.";
      }
      seedInput.track_inventory = parsed;
      return moveToStage(tenantId, telegramUserId, session.draftId, lang, seedInput, "awaiting_stock_qty");
    }
    case "awaiting_stock_qty":
      if (!isIntegerText(answer)) {
        return "Stock quantity must be an integer. Example: 10";
      }
      seedInput.stock_qty = Number.parseInt(answer, 10);
      return moveToStage(
        tenantId,
        telegramUserId,
        session.draftId,
        lang,
        seedInput,
        "awaiting_low_stock_threshold"
      );
    case "awaiting_low_stock_threshold":
      if (!isIntegerText(answer)) {
        return "Low stock threshold must be an integer. Example: 5";
      }
      seedInput.low_stock_threshold = Number.parseInt(answer, 10);
      return moveToStage(tenantId, telegramUserId, session.draftId, lang, seedInput, "awaiting_has_variants");
    case "awaiting_has_variants": {
      const parsed = parseBooleanInput(answer);
      if (parsed === null) {
        return "Has variants must be yes or no.";
      }
      seedInput.has_variants = parsed;
      return moveToStage(tenantId, telegramUserId, session.draftId, lang, seedInput, "awaiting_image_urls");
    }
    case "awaiting_image_urls": {
      const urls = parseImageUrls(answer);
      if (urls === null) {
        return "Send up to 3 valid image URLs, comma-separated, or upload an image here in Telegram. Use /skip for none.";
      }
      seedInput.image_urls = urls;
      return beginAiDraftFromSeed(tenantId, telegramUserId, lang, seedInput);
    }
    case "answering": {
      if (!session.draftId) {
        await deleteSession(telegramUserId);
        return "Draft session was lost. Send /addproduct to start again.";
      }

      const result = await answerProductDraft(tenantId, {
        draftId: session.draftId,
        answer,
      });

      if (result.message && !result.draft) {
        await deleteSession(telegramUserId);
        return `${result.message}. Send /addproduct to start again.`;
      }

      const nextStage: SessionStage = result.nextQuestion ? "answering" : "ready";
      await saveSession({
        telegramUserId,
        tenantId,
        draftId: session.draftId,
        stage: nextStage,
        lang,
        seedInput,
      });

      if (result.nextQuestion) {
        return result.nextQuestion;
      }

      return "Draft is ready. Send /confirm to create the product or /cancel to discard it.";
    }
    case "ready":
      return "Draft is already ready. Send /confirm to create the product or /cancel to discard it.";
  }
}

export async function handleTelegramProductDraftImage(tenantId: string, telegramUserId: number, file: File) {
  const session = await db.query.telegramProductDraftSessions.findFirst({
    where: eq(telegramProductDraftSessions.telegramUserId, telegramUserId),
  });

  if (!session || session.tenantId !== tenantId) {
    return null;
  }

  if ((session.stage as SessionStage) !== "awaiting_image_urls") {
    return "This image was received, but the draft is not on the image step yet.";
  }

  const lang = session.lang as DraftLanguage;
  const seedInput = { ...((session.seedInput ?? {}) as SeedInput) };
  const existingUrls = Array.isArray(seedInput.image_urls) ? seedInput.image_urls : [];

  if (existingUrls.length >= MAX_TELEGRAM_DRAFT_IMAGES) {
    return `Maximum ${MAX_TELEGRAM_DRAFT_IMAGES} images allowed. Send /confirm to continue or /skip to continue without more images.`;
  }

  const upload = await uploadTelegramDraftImageToCloudinary({
    file,
    tenantId,
    telegramUserId,
  });

  seedInput.image_urls = [...existingUrls, upload.publicUrl];
  await saveSession({
    telegramUserId,
    tenantId,
    draftId: session.draftId,
    stage: "awaiting_image_urls",
    lang,
    seedInput,
  });

  return [
    `Image uploaded (${seedInput.image_urls.length}/${MAX_TELEGRAM_DRAFT_IMAGES}).`,
    "Send another image, send image URL(s), or use /skip to continue.",
  ].join("\n");
}

export async function confirmTelegramProductDraft(tenantId: string, telegramUserId: number) {
  const session = await db.query.telegramProductDraftSessions.findFirst({
    where: eq(telegramProductDraftSessions.telegramUserId, telegramUserId),
  });

  if (!session || session.tenantId !== tenantId || !session.draftId) {
    return "No Telegram product draft is in progress. Send /addproduct to start one.";
  }

  const draft = await getProductDraftById(tenantId, session.draftId);
  if (!draft) {
    await deleteSession(telegramUserId);
    return "Draft not found. Send /addproduct to start again.";
  }

  if (draft.status !== "ready") {
    return "Draft is not ready yet. Answer the current question first or send /cancel.";
  }

  const result = await confirmProductDraft(tenantId, { draftId: session.draftId });
  if (result.error) {
    return `Unable to confirm draft: ${result.error}`;
  }

  await deleteSession(telegramUserId);
  return [
    "Product created successfully.",
    `Product: ${result.product.name}`,
    `ID: ${result.product.id}`,
    result.variants.length > 0 ? `Variants: ${result.variants.length}` : "Variants: 0",
    `Index status: ${result.index.status}`,
  ].join("\n");
}

export async function cancelTelegramProductDraft(tenantId: string, telegramUserId: number) {
  const session = await db.query.telegramProductDraftSessions.findFirst({
    where: eq(telegramProductDraftSessions.telegramUserId, telegramUserId),
  });

  if (!session || session.tenantId !== tenantId) {
    return "No Telegram product draft is in progress.";
  }

  if (session.draftId) {
    await db
      .update(productDrafts)
      .set({
        status: "cancelled",
        updatedAt: new Date(),
      })
      .where(and(eq(productDrafts.id, session.draftId), eq(productDrafts.tenantId, tenantId)));
  }

  await deleteSession(telegramUserId);
  return "Telegram product draft cancelled.";
}

export async function getTelegramProductDraftStatus(tenantId: string, telegramUserId: number) {
  const session = await db.query.telegramProductDraftSessions.findFirst({
    where: eq(telegramProductDraftSessions.telegramUserId, telegramUserId),
  });

  if (!session || session.tenantId !== tenantId) {
    return null;
  }

  switch (session.stage as SessionStage) {
    case "awaiting_name":
    case "awaiting_description":
    case "awaiting_category":
    case "awaiting_price_usd":
    case "awaiting_price_khr":
    case "awaiting_track_inventory":
    case "awaiting_stock_qty":
    case "awaiting_low_stock_threshold":
    case "awaiting_has_variants":
    case "awaiting_image_urls":
      return formatSeedPrompt(session.stage as SessionStage);
    case "answering":
      return "Product draft is in progress. Reply to the current AI question, or send /cancel.";
    case "ready":
      return "Product draft is ready. Send /confirm to create the product or /cancel to discard it.";
  }
}
