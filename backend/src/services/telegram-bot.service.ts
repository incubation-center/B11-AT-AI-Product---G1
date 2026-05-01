import { answerTelegramCallbackQuery, downloadTelegramFileAsImage, sendTelegramMessage } from "../lib/telegram";
import { env } from "../env";
import { listLowStockItems } from "./inventory.service";
import { getOwnerOrderById, listOwnerOrders } from "./order.service";
import { listProducts } from "./product.service";
import { getTenantById } from "./tenant.service";
import { consumeTelegramLinkCode, getTenantLinkByTelegramUser } from "./telegram-link.service";
import {
  cancelTelegramProductDraft,
  confirmTelegramProductDraft,
  getTelegramProductDraftStatus,
  handleTelegramProductDraftImage,
  handleTelegramProductDraftReply,
  handleTelegramSkip,
  startTelegramProductDraft,
} from "./telegram-product-draft.service";

type TelegramBotResponseOptions = NonNullable<Parameters<typeof sendTelegramMessage>[2]>;
type TelegramBotResponse = { text: string; options?: TelegramBotResponseOptions };

type TelegramPhotoSize = {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  file_size?: number;
};

type TelegramDocument = {
  file_id: string;
  file_unique_id: string;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
};

type TelegramMessage = {
  message_id: number;
  text?: string;
  caption?: string;
  photo?: TelegramPhotoSize[];
  document?: TelegramDocument;
  from?: { id: number };
  chat: { id: number; type: string };
};

type TelegramCallbackQuery = {
  id: string;
  from?: { id: number };
  data?: string;
  message?: {
    chat: { id: number; type: string };
  };
};

type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
};

type TelegramInlineButton = {
  text: string;
  callback_data: string;
};

function normalizeCommand(text: string) {
  const trimmed = text.trim();
  const [rawCommand, ...rest] = trimmed.split(/\s+/);
  return {
    command: rawCommand.toLowerCase().split("@")[0],
    args: rest,
  };
}

function isValidHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function formatHelp() {
  return [
    "<b>CoolHat owner console</b>",
    "",
    "Link and launch:",
    "/connect &lt;code&gt; - link this Telegram account to your store",
    "/dashboard - open the management dashboard",
    "",
    "Quick store tools:",
    "/store - show store summary",
    "/products - show recent products",
    "/inventory - show low stock items",
    "/orders - show recent orders",
    "/order &lt;id&gt; - show a single order",
    "",
    "Product draft flow:",
    "/addproduct - start AI product creation",
    "/skip - skip an optional field in Telegram product draft",
    "/confirm - confirm the current Telegram product draft",
    "/cancel - cancel the current Telegram product draft",
    "",
    "/help - show this help",
  ].join("\n");
}

function buildMainMenuInlineKeyboard(): TelegramInlineButton[][] {
  return [
    [
      { text: "📊 Dashboard", callback_data: "/dashboard" },
      { text: "🛍 Products", callback_data: "/products" },
    ],
    [
      { text: "📦 Orders", callback_data: "/orders" },
      { text: "⚙️ Store", callback_data: "/store" },
    ],
    [
      { text: "➕ Add Product", callback_data: "/addproduct" },
      { text: "📉 Inventory", callback_data: "/inventory" },
    ],
    [{ text: "❓ Help", callback_data: "/help" }],
  ];
}

function buildMainResponseInlineKeyboard(): TelegramInlineButton[][] {
  return [
    [
      { text: "⬅️ Menu", callback_data: "/start" },
      { text: "➕ Add Product", callback_data: "/addproduct" },
    ],
  ];
}

function buildDraftStepInlineKeyboard(): TelegramInlineButton[][] {
  return [[{ text: "⏭ Skip", callback_data: "/skip" }, { text: "❌ Cancel", callback_data: "/cancel" }]];
}

function buildDraftReadyInlineKeyboard(): TelegramInlineButton[][] {
  return [[{ text: "✅ Confirm", callback_data: "/confirm" }, { text: "❌ Cancel", callback_data: "/cancel" }]];
}

function buildAiQuestionInlineKeyboard(): TelegramInlineButton[][] {
  return buildDraftReadyInlineKeyboard();
}

function getTelegramMiniAppUrl(screen?: "dashboard" | "store" | "products" | "orders") {
  const base = env.TELEGRAM_MINI_APP_URL ?? `${env.PUBLIC_URL.replace(/\/$/, "")}/telegram`;
  if (!screen) {
    return base;
  }
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}screen=${screen}`;
}

function mergeInlineKeyboard(
  current: TelegramBotResponseOptions["replyMarkup"],
  rows: TelegramInlineButton[][]
) {
  if (current && "inline_keyboard" in current) {
    return {
      inline_keyboard: [...current.inline_keyboard, ...rows],
    };
  }

  return {
    inline_keyboard: rows,
  };
}

function withInlineRows(response: TelegramBotResponse, rows: TelegramInlineButton[][]): TelegramBotResponse {
  return {
    ...response,
    options: {
      ...response.options,
      replyMarkup: mergeInlineKeyboard(response.options?.replyMarkup, rows),
    },
  };
}

function buildStartResponse(): TelegramBotResponse {
  return {
    text: ["<b>CoolHat owner console</b>", "", "Manage your store directly from Telegram."].join("\n"),
    options: {
      parseMode: "HTML",
      replyMarkup: {
        inline_keyboard: buildMainMenuInlineKeyboard(),
      },
    },
  };
}

function isDraftReadyText(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  return (
    normalized.startsWith("draft is ready.") ||
    normalized.startsWith("product draft is ready.") ||
    normalized.startsWith("draft is already ready.")
  );
}

function isDraftQuestionText(text: string): boolean {
  const normalized = text.trim();
  if (!normalized) {
    return false;
  }

  const lower = normalized.toLowerCase();
  // Seed-step prompts from telegram-product-draft.service should never be rendered as AI follow-up questions.
  if (lower.startsWith("send up to ")) return false;
  if (lower.startsWith("send the ")) return false;
  if (lower.startsWith("track inventory?")) return false;
  if (lower.startsWith("does this product have variants?")) return false;
  if (lower.startsWith("starting telegram product draft.")) return false;
  if (lower.includes("this collects the same core fields")) return false;
  if (lower.includes("use /skip for optional fields")) return false;
  if (lower.includes("must be")) return false;
  if (lower.includes("telegram product draft cancelled")) return false;
  if (lower.includes("product created successfully")) return false;
  if (lower.includes("no telegram product draft is in progress")) return false;
  if (lower.includes("this step cannot be skipped")) return false;
  if (lower.includes("draft not found")) return false;
  if (lower.includes("draft is not ready yet")) return false;

  return true;
}

function formatAiQuestionMessage(text: string): string {
  const stripped = text
    .replace(/\n\nReply with your answer\..*$/is, "")
    .replace(/^Product draft is in progress\..*$/i, "Please continue with the current question in this chat.")
    .trim();

  return ["🤖 <b>AI Question</b>", "", stripped, "", "Please type your answer below."].join("\n");
}

function formatReadyMessage(): string {
  return ["✅ <b>Draft is ready</b>", "", "You can now create the product."].join("\n");
}

function isAiFollowupPrompt(text: string): boolean {
  return /\n\nReply with your answer\./i.test(text);
}

function enhanceDraftResponse(
  response: TelegramBotResponse,
  origin: "addproduct" | "skip" | "confirm" | "cancel" | "draft-reply" | "draft-status" | "draft-image"
): TelegramBotResponse {
  const text = response.text.trim();
  const lower = text.toLowerCase();

  if (isDraftReadyText(text)) {
    return {
      text: formatReadyMessage(),
      options: {
        parseMode: "HTML",
        replyMarkup: {
          inline_keyboard: buildDraftReadyInlineKeyboard(),
        },
      },
    };
  }

  if (isAiFollowupPrompt(text) || (origin === "draft-reply" && isDraftQuestionText(text))) {
    return {
      text: formatAiQuestionMessage(text),
      options: {
        parseMode: "HTML",
        replyMarkup: {
          inline_keyboard: buildAiQuestionInlineKeyboard(),
        },
      },
    };
  }

  if (lower.startsWith("product created successfully") || lower.includes("telegram product draft cancelled")) {
    return withInlineRows(
      {
        ...response,
        options: {
          ...response.options,
          parseMode: response.options?.parseMode,
        },
      },
      buildMainResponseInlineKeyboard()
    );
  }

  if (lower.includes("no telegram product draft is in progress")) {
    return withInlineRows(response, buildMainResponseInlineKeyboard());
  }

  return withInlineRows(response, buildDraftStepInlineKeyboard());
}

function enhanceMainResponse(response: TelegramBotResponse): TelegramBotResponse {
  return withInlineRows(response, buildMainResponseInlineKeyboard());
}

function buildDashboardMessage(
  title: string,
  lines: string[],
  _screen: "dashboard" | "store" | "products" | "orders"
): TelegramBotResponse {
  return {
    text: [`<b>${title}</b>`, "", ...lines].join("\n"),
    options: {
      parseMode: "HTML" as const,
      replyMarkup: {
        inline_keyboard: buildMainResponseInlineKeyboard(),
      },
    },
  };
}

function formatStore(store: {
  shopName: string;
  subdomain: string;
  shopType: string;
  isActive: boolean;
  description?: string | null;
}) {
  return buildDashboardMessage(
    "Store summary",
    [
      `Store: ${store.shopName}`,
      `Subdomain: ${store.subdomain}`,
      `Type: ${store.shopType}`,
      `Active: ${store.isActive ? "yes" : "no"}`,
      ...(store.description ? [`Description: ${store.description}`] : []),
    ],
    "store"
  );
}

function formatLowStock(items: Awaited<ReturnType<typeof listLowStockItems>>) {
  if (items.length === 0) {
    return buildDashboardMessage(
      "Low stock",
      ["Inventory is healthy. No low stock items right now."],
      "products"
    );
  }

  return buildDashboardMessage(
    "Low stock",
    [
      ...items.slice(0, 15).map((item) => {
        const label = item.level === "variant" ? `${item.productName} (${item.variantLabel ?? "variant"})` : item.productName;
        return `- ${label}: ${item.stockQty} left (threshold ${item.lowStockThreshold})`;
      }),
    ],
    "products"
  );
}

function formatOrders(orders: Awaited<ReturnType<typeof listOwnerOrders>>) {
  if (orders.length === 0) {
    return buildDashboardMessage("Orders", ["No orders yet."], "orders");
  }

  return buildDashboardMessage(
    "Recent orders",
    orders.slice(0, 8).map((order) => `- ${order.orderNo} | ${order.status} | ${order.paymentStatus} | ${order.total} ${order.currency}`),
    "orders"
  );
}

function formatOrderDetail(order: NonNullable<Awaited<ReturnType<typeof getOwnerOrderById>>>) {
  return buildDashboardMessage(
    `Order ${order.orderNo}`,
    [
      `Customer: ${order.customerName}`,
      `Phone: ${order.customerPhone ?? "-"}`,
      `Status: ${order.status}`,
      `Payment: ${order.paymentStatus} via ${order.paymentMethod}`,
      `Total: ${order.total} ${order.currency}`,
      `Address: ${order.addressText}`,
      "Items:",
      ...order.items.map((item) => `- ${item.productNameSnapshot} x${item.qty}`),
    ],
    "orders"
  );
}

function formatProducts(products: Awaited<ReturnType<typeof listProducts>>) {
  if (products.data.length === 0) {
    return buildDashboardMessage("Products", ["No products yet. Use the dashboard to create one."], "products");
  }

  return buildDashboardMessage(
    "Recent products",
    products.data
      .slice(0, 8)
      .map((product) => `- ${product.name} | ${product.basePriceUsd} USD | stock ${product.stockQty} | ${product.isActive ? "active" : "inactive"}`),
    "products"
  );
}

function formatDashboardLaunch(linkedTenantId: string | null) {
  if (!linkedTenantId) {
    return {
      text: "This Telegram account is not linked yet. Use /connect <code> first.",
      options: undefined,
    };
  }

  return buildDashboardMessage(
    "Dashboard",
    [
      "Your Telegram account is linked.",
      "Open the Mini App to manage store settings, products, orders, and uploads.",
    ],
    "dashboard"
  );
}

async function resolveTenantId(telegramUserId: number) {
  const link = await getTenantLinkByTelegramUser(telegramUserId);
  if (!link) {
    return { tenantId: null, message: "This Telegram account is not linked yet. Use /connect <code> first." };
  }

  return { tenantId: link.tenantId, message: null };
}

async function handleConnect(telegramUserId: number, args: string[]): Promise<TelegramBotResponse> {
  const code = args[0]?.trim();
  if (!code) {
    return { text: "Usage: /connect <code>", options: undefined };
  }

  const result = await consumeTelegramLinkCode(telegramUserId, code);
  if (!result.ok) {
    return { text: result.reason, options: undefined };
  }

  return buildDashboardMessage(
    "Telegram linked successfully",
    [
      "You can now manage your store directly from Telegram.",
      "Use the dashboard for store settings, products, and orders.",
    ],
    "dashboard"
  );
}

async function handleStore(telegramUserId: number): Promise<TelegramBotResponse> {
  const linked = await resolveTenantId(telegramUserId);
  if (!linked.tenantId) {
    return { text: linked.message!, options: undefined };
  }

  const store = await getTenantById(linked.tenantId);
  if (!store) {
    return { text: "Store not found.", options: undefined };
  }

  return formatStore(store);
}

async function handleInventory(telegramUserId: number): Promise<TelegramBotResponse> {
  const linked = await resolveTenantId(telegramUserId);
  if (!linked.tenantId) {
    return { text: linked.message!, options: undefined };
  }

  const items = await listLowStockItems(linked.tenantId);
  return formatLowStock(items);
}

async function handleOrders(telegramUserId: number): Promise<TelegramBotResponse> {
  const linked = await resolveTenantId(telegramUserId);
  if (!linked.tenantId) {
    return { text: linked.message!, options: undefined };
  }

  const orders = await listOwnerOrders(linked.tenantId, {});
  return formatOrders(orders);
}

async function handleOrder(telegramUserId: number, args: string[]): Promise<TelegramBotResponse> {
  const linked = await resolveTenantId(telegramUserId);
  if (!linked.tenantId) {
    return { text: linked.message!, options: undefined };
  }

  const orderId = args[0]?.trim();
  if (!orderId) {
    return { text: "Usage: /order <id>", options: undefined };
  }

  const order = await getOwnerOrderById(linked.tenantId, orderId);
  if (!order) {
    return { text: "Order not found.", options: undefined };
  }

  return formatOrderDetail(order);
}

async function handleProducts(telegramUserId: number): Promise<TelegramBotResponse> {
  const linked = await resolveTenantId(telegramUserId);
  if (!linked.tenantId) {
    return { text: linked.message!, options: undefined };
  }

  const products = await listProducts(linked.tenantId, {
    page: 1,
    pageSize: 8,
    includeInactive: true,
  });
  return formatProducts(products);
}

async function handleAddProduct(telegramUserId: number): Promise<TelegramBotResponse> {
  const linked = await resolveTenantId(telegramUserId);
  if (!linked.tenantId) {
    return { text: linked.message!, options: undefined };
  }

  return { text: await startTelegramProductDraft(linked.tenantId, telegramUserId), options: undefined };
}

async function handleConfirm(telegramUserId: number): Promise<TelegramBotResponse> {
  const linked = await resolveTenantId(telegramUserId);
  if (!linked.tenantId) {
    return { text: linked.message!, options: undefined };
  }

  return { text: await confirmTelegramProductDraft(linked.tenantId, telegramUserId), options: undefined };
}

async function handleCancel(telegramUserId: number): Promise<TelegramBotResponse> {
  const linked = await resolveTenantId(telegramUserId);
  if (!linked.tenantId) {
    return { text: linked.message!, options: undefined };
  }

  return { text: await cancelTelegramProductDraft(linked.tenantId, telegramUserId), options: undefined };
}

async function handleSkip(telegramUserId: number): Promise<TelegramBotResponse> {
  const linked = await resolveTenantId(telegramUserId);
  if (!linked.tenantId) {
    return { text: linked.message!, options: undefined };
  }

  return { text: await handleTelegramSkip(linked.tenantId, telegramUserId), options: undefined };
}

function pickTelegramImageFile(message: TelegramMessage) {
  const photo = Array.isArray(message.photo) ? message.photo[message.photo.length - 1] : null;
  if (photo?.file_id) {
    return {
      fileId: photo.file_id,
      fileName: `telegram-photo-${photo.file_unique_id}.jpg`,
      mimeType: "image/jpeg",
    };
  }

  const document = message.document;
  if (document?.file_id && document.mime_type?.startsWith("image/")) {
    return {
      fileId: document.file_id,
      fileName: document.file_name,
      mimeType: document.mime_type,
    };
  }

  return null;
}

export async function handleTelegramWebhook(update: TelegramUpdate): Promise<void> {
  const callbackQuery = update.callback_query;
  const message = update.message ?? callbackQuery?.message;
  if (!message) {
    return;
  }

  const telegramUserId = update.message?.from?.id ?? callbackQuery?.from?.id;
  if (!telegramUserId) {
    if (callbackQuery?.id) {
      await answerTelegramCallbackQuery(callbackQuery.id);
    }
    return;
  }

  const chatId = message.chat.id;
  const text = update.message?.text?.trim() ?? callbackQuery?.data?.trim();
  const imageFile = update.message ? pickTelegramImageFile(update.message) : null;

  if (imageFile) {
    const linked = await resolveTenantId(telegramUserId);
    const responseText = !linked.tenantId
      ? linked.message!
      : await (async () => {
          try {
            const file = await downloadTelegramFileAsImage(imageFile);
            const draftReply = await handleTelegramProductDraftImage(linked.tenantId!, telegramUserId, file);
            return draftReply ?? "Image received. Start with /addproduct to attach it to a product draft.";
          } catch (error) {
            return error instanceof Error ? error.message : "Unable to process image upload.";
          }
        })();

    const imageResponse = enhanceDraftResponse({ text: responseText, options: undefined }, "draft-image");
    await sendTelegramMessage(chatId, imageResponse.text, imageResponse.options);
    if (callbackQuery?.id) {
      await answerTelegramCallbackQuery(callbackQuery.id);
    }
    return;
  }

  if (!text) {
    if (callbackQuery?.id) {
      await answerTelegramCallbackQuery(callbackQuery.id);
    }
    return;
  }

  const { command, args } = normalizeCommand(text);

  let response: TelegramBotResponse;
  switch (command) {
    case "/start":
      response = buildStartResponse();
      break;
    case "/help":
      response = {
        text: formatHelp(),
        options: {
          parseMode: "HTML",
          replyMarkup: {
            inline_keyboard: buildMainResponseInlineKeyboard(),
          },
        },
      };
      break;
    case "/connect":
      response = enhanceMainResponse(await handleConnect(telegramUserId, args));
      break;
    case "/dashboard":
      response = enhanceMainResponse(formatDashboardLaunch((await resolveTenantId(telegramUserId)).tenantId));
      break;
    case "/products":
      response = enhanceMainResponse(await handleProducts(telegramUserId));
      break;
    case "/addproduct":
      response = enhanceDraftResponse(await handleAddProduct(telegramUserId), "addproduct");
      break;
    case "/confirm":
      response = enhanceDraftResponse(await handleConfirm(telegramUserId), "confirm");
      break;
    case "/cancel":
      response = enhanceDraftResponse(await handleCancel(telegramUserId), "cancel");
      break;
    case "/skip":
      response = enhanceDraftResponse(await handleSkip(telegramUserId), "skip");
      break;
    case "/store":
      response = enhanceMainResponse(await handleStore(telegramUserId));
      break;
    case "/inventory":
      response = enhanceMainResponse(await handleInventory(telegramUserId));
      break;
    case "/orders":
      response = enhanceMainResponse(await handleOrders(telegramUserId));
      break;
    case "/order":
      response = enhanceMainResponse(await handleOrder(telegramUserId, args));
      break;
    default:
      if (!command.startsWith("/")) {
        const linked = await resolveTenantId(telegramUserId);
        if (!linked.tenantId) {
          response = { text: linked.message!, options: undefined };
          break;
        }

        const draftReply = await handleTelegramProductDraftReply(linked.tenantId, telegramUserId, text);
        if (draftReply) {
          response = enhanceDraftResponse({ text: draftReply, options: undefined }, "draft-reply");
          break;
        }

        const draftStatus = await getTelegramProductDraftStatus(linked.tenantId, telegramUserId);
        if (draftStatus) {
          response = enhanceDraftResponse({ text: draftStatus, options: undefined }, "draft-status");
          break;
        }
      }

      response = {
        text: `Unknown command.\n\n${formatHelp()}`,
        options: {
          parseMode: "HTML",
          replyMarkup: {
            inline_keyboard: buildMainResponseInlineKeyboard(),
          },
        },
      };
      break;
  }

  try {
    await sendTelegramMessage(chatId, response.text, response.options);
    if (callbackQuery?.id) {
      await answerTelegramCallbackQuery(callbackQuery.id);
    }
  } catch (error) {
    if (response.options?.replyMarkup) {
      await sendTelegramMessage(chatId, response.text);
      if (callbackQuery?.id) {
        await answerTelegramCallbackQuery(callbackQuery.id);
      }
      return;
    }

    throw error;
  }
}
