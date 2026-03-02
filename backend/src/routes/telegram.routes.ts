import { Hono } from "hono";
import { auth } from "../auth/config";
import { env } from "../env";
import { requireBearer } from "../middleware/require-bearer";
import { handleTelegramWebhook } from "../services/telegram-bot.service";
import { createTelegramLinkCode, getTelegramLinkStatus } from "../services/telegram-link.service";

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
