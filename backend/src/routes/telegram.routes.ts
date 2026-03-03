import { Hono } from "hono";
import { auth } from "../auth/config";
import { env } from "../env";
import { requireBearer } from "../middleware/require-bearer";
import { handleTelegramWebhook } from "../services/telegram-bot.service";
import { createTelegramLinkCode, getTelegramLinkStatus } from "../services/telegram-link.service";
import {
  cancelTelegramMiniAppOrder,
  createTelegramMiniAppProduct,
  createTelegramMiniAppSession,
  getTelegramMiniAppBootstrap,
  getTelegramMiniAppOrder,
  getTelegramMiniAppProduct,
  getTelegramMiniAppTenant,
  listTelegramMiniAppLowStock,
  listTelegramMiniAppOrders,
  listTelegramMiniAppProducts,
  updateTelegramMiniAppOrderPayment,
  updateTelegramMiniAppOrderStatus,
  updateTelegramMiniAppProduct,
  updateTelegramMiniAppProductStock,
  updateTelegramMiniAppTenant,
  uploadTelegramMiniAppProductImage,
  uploadTelegramMiniAppStoreAsset,
  deactivateTelegramMiniAppProduct,
} from "../services/telegram-miniapp.service";

export const telegramRoutes = new Hono();

async function getSessionUser(headers: Headers) {
  const session = await auth.api.getSession({
    headers,
  });

  return session?.user ?? null;
}

telegramRoutes.get("/telegram/link-status", requireBearer, async (c) => {
  const sessionUser = await getSessionUser(c.req.raw.headers);
  if (!sessionUser) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  try {
    const status = await getTelegramLinkStatus(sessionUser);
    return c.json(status);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load Telegram link status";
    return c.json({ message }, 400);
  }
});

telegramRoutes.post("/telegram/link-code", requireBearer, async (c) => {
  const sessionUser = await getSessionUser(c.req.raw.headers);
  if (!sessionUser) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  try {
    const result = await createTelegramLinkCode(sessionUser);
    return c.json({
      message: "Telegram link code generated",
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate Telegram link code";
    return c.json({ message }, message === "Tenant not found" ? 404 : 400);
  }
});

telegramRoutes.post("/telegram/webhook", async (c) => {
  if (env.TELEGRAM_WEBHOOK_SECRET) {
    const secret = c.req.header("x-telegram-bot-api-secret-token");
    if (secret !== env.TELEGRAM_WEBHOOK_SECRET) {
      return c.json({ message: "Forbidden" }, 403);
    }
  }

  const update = await c.req.json().catch(() => null);
  if (!update) {
    return c.json({ message: "Invalid Telegram update" }, 400);
  }

  try {
    await handleTelegramWebhook(update);
    return c.json({ ok: true });
  } catch (error) {
    console.error("[telegram] webhook handler failed", { error });
    return c.json({ ok: false }, 500);
  }
});

telegramRoutes.post("/telegram/miniapp/session", async (c) => {
  const body = await c.req.json().catch(() => null);
  const initData = typeof body?.initData === "string" ? body.initData.trim() : "";
  if (!initData) {
    return c.json({ message: "initData is required" }, 400);
  }

  try {
    const session = await createTelegramMiniAppSession(initData);
    return c.json({
      message: "Mini App session created",
      session,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create Mini App session";
    return c.json({ message }, message === "This Telegram account is not linked to a store yet." ? 403 : 400);
  }
});

telegramRoutes.get("/telegram/miniapp/bootstrap", requireBearer, async (c) => {
  try {
    const result = await getTelegramMiniAppBootstrap(c.req.header("authorization"));
    return c.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load dashboard";
    return c.json({ message }, message === "Unauthorized" ? 401 : 400);
  }
});

telegramRoutes.get("/telegram/miniapp/tenant", requireBearer, async (c) => {
  try {
    const tenant = await getTelegramMiniAppTenant(c.req.header("authorization"));
    return c.json({ tenant });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load tenant";
    return c.json({ message }, message === "Unauthorized" ? 401 : 400);
  }
});

telegramRoutes.patch("/telegram/miniapp/tenant", requireBearer, async (c) => {
  const body = await c.req.json().catch(() => null);
  try {
    const tenant = await updateTelegramMiniAppTenant(c.req.header("authorization"), body ?? {});
    return c.json({ message: "Tenant updated", tenant });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update tenant";
    return c.json({ message }, message === "Unauthorized" ? 401 : 400);
  }
});

telegramRoutes.post("/telegram/miniapp/tenant/assets", requireBearer, async (c) => {
  const form = await c.req.formData().catch(() => null);
  const type = form?.get("type");
  const file = form?.get("file");

  if (type !== "logo" && type !== "banner") {
    return c.json({ message: "type must be logo or banner" }, 400);
  }
  if (!(file instanceof File)) {
    return c.json({ message: "file is required" }, 400);
  }

  try {
    const upload = await uploadTelegramMiniAppStoreAsset(c.req.header("authorization"), type, file);
    return c.json({ message: "Asset uploaded", upload });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to upload asset";
    return c.json({ message }, message === "Unauthorized" ? 401 : 400);
  }
});

telegramRoutes.get("/telegram/miniapp/products", requireBearer, async (c) => {
  try {
    const result = await listTelegramMiniAppProducts(c.req.header("authorization"), {
      q: c.req.query("q"),
      page: c.req.query("page"),
      page_size: c.req.query("page_size"),
      include_inactive: c.req.query("include_inactive"),
    });
    return c.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load products";
    return c.json({ message }, message === "Unauthorized" ? 401 : 400);
  }
});

telegramRoutes.post("/telegram/miniapp/products", requireBearer, async (c) => {
  const body = await c.req.json().catch(() => null);
  try {
    const product = await createTelegramMiniAppProduct(c.req.header("authorization"), body ?? {});
    return c.json({ message: "Product created", product }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create product";
    return c.json({ message }, message === "Unauthorized" ? 401 : 400);
  }
});

telegramRoutes.get("/telegram/miniapp/products/:id", requireBearer, async (c) => {
  const productId = c.req.param("id")?.trim();
  if (!productId) {
    return c.json({ message: "product id is required" }, 400);
  }

  try {
    const product = await getTelegramMiniAppProduct(c.req.header("authorization"), productId);
    if (!product) return c.json({ message: "Product not found" }, 404);
    return c.json({ product });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load product";
    return c.json({ message }, message === "Unauthorized" ? 401 : 400);
  }
});

telegramRoutes.patch("/telegram/miniapp/products/:id", requireBearer, async (c) => {
  const productId = c.req.param("id")?.trim();
  if (!productId) {
    return c.json({ message: "product id is required" }, 400);
  }

  const body = await c.req.json().catch(() => null);
  try {
    const product = await updateTelegramMiniAppProduct(c.req.header("authorization"), productId, body ?? {});
    if (!product) return c.json({ message: "Product not found" }, 404);
    return c.json({ message: "Product updated", product });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update product";
    return c.json({ message }, message === "Unauthorized" ? 401 : 400);
  }
});

telegramRoutes.patch("/telegram/miniapp/products/:id/deactivate", requireBearer, async (c) => {
  const productId = c.req.param("id")?.trim();
  if (!productId) {
    return c.json({ message: "product id is required" }, 400);
  }

  try {
    const product = await deactivateTelegramMiniAppProduct(c.req.header("authorization"), productId);
    if (!product) return c.json({ message: "Product not found" }, 404);
    return c.json({ message: "Product deactivated", product });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to deactivate product";
    return c.json({ message }, message === "Unauthorized" ? 401 : 400);
  }
});

telegramRoutes.patch("/telegram/miniapp/products/:id/stock", requireBearer, async (c) => {
  const productId = c.req.param("id")?.trim();
  if (!productId) {
    return c.json({ message: "product id is required" }, 400);
  }

  const body = await c.req.json().catch(() => null);
  try {
    const product = await updateTelegramMiniAppProductStock(c.req.header("authorization"), productId, body?.stock_qty);
    if (!product) return c.json({ message: "Product not found" }, 404);
    return c.json({ message: "Product stock updated", product });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update stock";
    return c.json({ message }, message === "Unauthorized" ? 401 : 400);
  }
});

telegramRoutes.post("/telegram/miniapp/products/:id/images", requireBearer, async (c) => {
  const productId = c.req.param("id")?.trim();
  if (!productId) {
    return c.json({ message: "product id is required" }, 400);
  }

  const form = await c.req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return c.json({ message: "file is required" }, 400);
  }

  try {
    const result = await uploadTelegramMiniAppProductImage(c.req.header("authorization"), productId, file);
    return c.json({ message: "Image uploaded", upload: result.upload, image_urls: result.imageUrls });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to upload image";
    return c.json({ message }, message === "Unauthorized" ? 401 : 400);
  }
});

telegramRoutes.get("/telegram/miniapp/orders", requireBearer, async (c) => {
  try {
    const orders = await listTelegramMiniAppOrders(c.req.header("authorization"), {
      status: c.req.query("status"),
      from: c.req.query("from"),
      to: c.req.query("to"),
    });
    return c.json({ orders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load orders";
    return c.json({ message }, message === "Unauthorized" ? 401 : 400);
  }
});

telegramRoutes.get("/telegram/miniapp/orders/:id", requireBearer, async (c) => {
  const orderId = c.req.param("id")?.trim();
  if (!orderId) {
    return c.json({ message: "order id is required" }, 400);
  }

  try {
    const order = await getTelegramMiniAppOrder(c.req.header("authorization"), orderId);
    if (!order) return c.json({ message: "Order not found" }, 404);
    return c.json({ order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load order";
    return c.json({ message }, message === "Unauthorized" ? 401 : 400);
  }
});

telegramRoutes.patch("/telegram/miniapp/orders/:id/status", requireBearer, async (c) => {
  const orderId = c.req.param("id")?.trim();
  if (!orderId) {
    return c.json({ message: "order id is required" }, 400);
  }

  const body = await c.req.json().catch(() => null);
  try {
    const order = await updateTelegramMiniAppOrderStatus(c.req.header("authorization"), orderId, body?.status);
    return c.json({ message: "Order status updated", order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update order status";
    return c.json({ message }, message === "Unauthorized" ? 401 : 400);
  }
});

telegramRoutes.patch("/telegram/miniapp/orders/:id/payment", requireBearer, async (c) => {
  const orderId = c.req.param("id")?.trim();
  if (!orderId) {
    return c.json({ message: "order id is required" }, 400);
  }

  const body = await c.req.json().catch(() => null);
  try {
    const order = await updateTelegramMiniAppOrderPayment(c.req.header("authorization"), orderId, body ?? {});
    return c.json({ message: "Order payment updated", order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update order payment";
    return c.json({ message }, message === "Unauthorized" ? 401 : 400);
  }
});

telegramRoutes.post("/telegram/miniapp/orders/:id/cancel", requireBearer, async (c) => {
  const orderId = c.req.param("id")?.trim();
  if (!orderId) {
    return c.json({ message: "order id is required" }, 400);
  }

  try {
    const order = await cancelTelegramMiniAppOrder(c.req.header("authorization"), orderId);
    return c.json({ message: "Order cancelled", order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to cancel order";
    return c.json({ message }, message === "Unauthorized" ? 401 : 400);
  }
});

telegramRoutes.get("/telegram/miniapp/inventory/low-stock", requireBearer, async (c) => {
  try {
    const items = await listTelegramMiniAppLowStock(c.req.header("authorization"));
    return c.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load low stock items";
    return c.json({ message }, message === "Unauthorized" ? 401 : 400);
  }
});
