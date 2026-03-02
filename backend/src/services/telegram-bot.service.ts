import { sendTelegramMessage } from "../lib/telegram";
import { listLowStockItems } from "./inventory.service";
import { getOwnerOrderById, listOwnerOrders } from "./order.service";
import { getTenantById } from "./tenant.service";
import { consumeTelegramLinkCode, getTenantLinkByTelegramUser } from "./telegram-link.service";
import {
  cancelTelegramProductDraft,
  confirmTelegramProductDraft,
  getTelegramProductDraftStatus,
  handleTelegramProductDraftReply,
  handleTelegramSkip,
  startTelegramProductDraft,
} from "./telegram-product-draft.service";

type TelegramMessage = {
  message_id: number;
  text?: string;
  from?: { id: number };
  chat: { id: number; type: string };
};

type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
};

function normalizeCommand(text: string) {
  const trimmed = text.trim();
  const [rawCommand, ...rest] = trimmed.split(/\s+/);
  return {
    command: rawCommand.toLowerCase().split("@")[0],
    args: rest,
  };
}

function formatHelp() {
  return [
    "Store owner bot commands:",
    "/connect <code> - link this Telegram account to your store",
    "/addproduct - start AI product creation",
    "/skip - skip an optional field in Telegram product draft",
    "/confirm - confirm the current Telegram product draft",
    "/cancel - cancel the current Telegram product draft",
    "/store - show store summary",
    "/inventory - show low stock items",
    "/orders - show recent orders",
    "/order <id> - show a single order",
    "/help - show this help",
  ].join("\n");
}

function formatStore(store: {
  shopName: string;
  subdomain: string;
  shopType: string;
  isActive: boolean;
  description?: string | null;
}) {
  return [
    `Store: ${store.shopName}`,
    `Subdomain: ${store.subdomain}`,
    `Type: ${store.shopType}`,
    `Active: ${store.isActive ? "yes" : "no"}`,
    store.description ? `Description: ${store.description}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function formatLowStock(items: Awaited<ReturnType<typeof listLowStockItems>>) {
  if (items.length === 0) {
    return "Inventory is healthy. No low stock items right now.";
  }

  return [
    "Low stock items:",
    ...items.slice(0, 15).map((item) => {
      const label = item.level === "variant" ? `${item.productName} (${item.variantLabel ?? "variant"})` : item.productName;
      return `- ${label}: ${item.stockQty} left (threshold ${item.lowStockThreshold})`;
    }),
  ].join("\n");
}

function formatOrders(orders: Awaited<ReturnType<typeof listOwnerOrders>>) {
  if (orders.length === 0) {
    return "No orders yet.";
  }

  return [
    "Recent orders:",
    ...orders.slice(0, 8).map((order) => `- ${order.orderNo} | ${order.status} | ${order.paymentStatus} | ${order.total} ${order.currency}`),
  ].join("\n");
}

function formatOrderDetail(order: NonNullable<Awaited<ReturnType<typeof getOwnerOrderById>>>) {
  return [
    `Order: ${order.orderNo}`,
    `Customer: ${order.customerName}`,
    `Phone: ${order.customerPhone ?? "-"}`,
    `Status: ${order.status}`,
    `Payment: ${order.paymentStatus} via ${order.paymentMethod}`,
    `Total: ${order.total} ${order.currency}`,
    `Address: ${order.addressText}`,
    "Items:",
    ...order.items.map((item) => `- ${item.productNameSnapshot} x${item.qty}`),
  ].join("\n");
}

async function resolveTenantId(telegramUserId: number) {
  const link = await getTenantLinkByTelegramUser(telegramUserId);
  if (!link) {
    return { tenantId: null, message: "This Telegram account is not linked yet. Use /connect <code> first." };
  }

  return { tenantId: link.tenantId, message: null };
}

async function handleConnect(telegramUserId: number, args: string[]) {
  const code = args[0]?.trim();
  if (!code) {
    return "Usage: /connect <code>";
  }

  const result = await consumeTelegramLinkCode(telegramUserId, code);
  if (!result.ok) {
    return result.reason;
  }

  return "Telegram linked successfully. You can now use /store, /inventory, and /orders.";
}

async function handleStore(telegramUserId: number) {
  const linked = await resolveTenantId(telegramUserId);
  if (!linked.tenantId) {
    return linked.message!;
  }

  const store = await getTenantById(linked.tenantId);
  if (!store) {
    return "Store not found.";
  }

  return formatStore(store);
}

async function handleInventory(telegramUserId: number) {
  const linked = await resolveTenantId(telegramUserId);
  if (!linked.tenantId) {
    return linked.message!;
  }

  const items = await listLowStockItems(linked.tenantId);
  return formatLowStock(items);
}

async function handleOrders(telegramUserId: number) {
  const linked = await resolveTenantId(telegramUserId);
  if (!linked.tenantId) {
    return linked.message!;
  }

  const orders = await listOwnerOrders(linked.tenantId, {});
  return formatOrders(orders);
}

async function handleOrder(telegramUserId: number, args: string[]) {
  const linked = await resolveTenantId(telegramUserId);
  if (!linked.tenantId) {
    return linked.message!;
  }

  const orderId = args[0]?.trim();
  if (!orderId) {
    return "Usage: /order <id>";
  }

  const order = await getOwnerOrderById(linked.tenantId, orderId);
  if (!order) {
    return "Order not found.";
  }

  return formatOrderDetail(order);
}

async function handleAddProduct(telegramUserId: number) {
  const linked = await resolveTenantId(telegramUserId);
  if (!linked.tenantId) {
    return linked.message!;
  }

  return startTelegramProductDraft(linked.tenantId, telegramUserId);
}

async function handleConfirm(telegramUserId: number) {
  const linked = await resolveTenantId(telegramUserId);
  if (!linked.tenantId) {
    return linked.message!;
  }

  return confirmTelegramProductDraft(linked.tenantId, telegramUserId);
}

async function handleCancel(telegramUserId: number) {
  const linked = await resolveTenantId(telegramUserId);
  if (!linked.tenantId) {
    return linked.message!;
  }

  return cancelTelegramProductDraft(linked.tenantId, telegramUserId);
}

async function handleSkip(telegramUserId: number) {
  const linked = await resolveTenantId(telegramUserId);
  if (!linked.tenantId) {
    return linked.message!;
  }

  return handleTelegramSkip(linked.tenantId, telegramUserId);
}

export async function handleTelegramWebhook(update: TelegramUpdate): Promise<void> {
  const message = update.message;
  if (!message?.text || !message.from?.id) {
    return;
  }

  const { command, args } = normalizeCommand(message.text);
  const telegramUserId = message.from.id;
  const chatId = message.chat.id;

  let responseText: string;
  switch (command) {
    case "/start":
    case "/help":
      responseText = formatHelp();
      break;
    case "/connect":
      responseText = await handleConnect(telegramUserId, args);
      break;
    case "/addproduct":
      responseText = await handleAddProduct(telegramUserId);
      break;
    case "/confirm":
      responseText = await handleConfirm(telegramUserId);
      break;
    case "/cancel":
      responseText = await handleCancel(telegramUserId);
      break;
    case "/skip":
      responseText = await handleSkip(telegramUserId);
      break;
    case "/store":
      responseText = await handleStore(telegramUserId);
      break;
    case "/inventory":
      responseText = await handleInventory(telegramUserId);
      break;
    case "/orders":
      responseText = await handleOrders(telegramUserId);
      break;
    case "/order":
      responseText = await handleOrder(telegramUserId, args);
      break;
    default:
      if (!command.startsWith("/")) {
        const linked = await resolveTenantId(telegramUserId);
        if (!linked.tenantId) {
          responseText = linked.message!;
          break;
        }

        const draftReply = await handleTelegramProductDraftReply(linked.tenantId, telegramUserId, message.text);
        if (draftReply) {
          responseText = draftReply;
          break;
        }

        const draftStatus = await getTelegramProductDraftStatus(linked.tenantId, telegramUserId);
        if (draftStatus) {
          responseText = draftStatus;
          break;
        }
      }

      responseText = `Unknown command.\n\n${formatHelp()}`;
      break;
  }

  await sendTelegramMessage(chatId, responseText);
}
