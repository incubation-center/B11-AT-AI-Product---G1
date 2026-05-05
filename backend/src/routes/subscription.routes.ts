import { PayWayHttpError } from "@hezos/aba-payway-sdk";
import { Hono } from "hono";
import type { Context } from "hono";
import { requireBearer } from "../middleware/require-bearer";
import {
  confirmSubscriptionPayment,
  getMySubscriptionSummary,
  initSubscriptionPayment,
  startTrialSubscription,
} from "../services/subscription.service";
import type { SessionUser } from "../types/auth";
import type { PaidSubscriptionPlanId } from "../types/subscription";

const paidPlanIds = new Set<PaidSubscriptionPlanId>(["starter", "growth"]);

function unauthorized(c: Context) {
  return c.json({ message: "Unauthorized" }, 401);
}

function getAuthUser(c: Context): SessionUser | null {
  try {
    return c.get("authUser");
  } catch {
    return null;
  }
}

async function readJsonBody(c: Context): Promise<Record<string, unknown> | null> {
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }
  return body as Record<string, unknown>;
}

function parsePaidPlanId(value: unknown): PaidSubscriptionPlanId | null {
  return typeof value === "string" && paidPlanIds.has(value as PaidSubscriptionPlanId)
    ? (value as PaidSubscriptionPlanId)
    : null;
}

function parseRequiredString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function handleSubscriptionError(c: Context, error: unknown) {
  if (error instanceof PayWayHttpError) {
    return c.json(error.data, error.status as 400);
  }

  if (error instanceof DOMException && error.name === "TimeoutError") {
    return c.json({ message: "PayWay status check timed out. Please try again." }, 504);
  }

  return c.json({ message: error instanceof Error ? error.message : "Billing request failed" }, 500);
}

export const subscriptionRoutes = new Hono();

subscriptionRoutes.get("/billing/subscription", requireBearer, async (c) => {
  const authUser = getAuthUser(c);
  if (!authUser) return unauthorized(c);

  try {
    const summary = await getMySubscriptionSummary(authUser);
    return c.json(summary);
  } catch (error) {
    return handleSubscriptionError(c, error);
  }
});

subscriptionRoutes.post("/billing/trial", requireBearer, async (c) => {
  const authUser = getAuthUser(c);
  if (!authUser) return unauthorized(c);

  try {
    const subscription = await startTrialSubscription(authUser);
    return c.json({ subscription }, 201);
  } catch (error) {
    return handleSubscriptionError(c, error);
  }
});

subscriptionRoutes.post("/billing/payway/init", requireBearer, async (c) => {
  const authUser = getAuthUser(c);
  if (!authUser) return unauthorized(c);

  try {
    const body = await readJsonBody(c);
    const planId = parsePaidPlanId(body?.plan_id);
    if (!planId) {
      return c.json({ message: "plan_id must be starter or growth" }, 400);
    }

    const result = await initSubscriptionPayment(authUser, planId, c.req.raw.headers);
    return c.json(result);
  } catch (error) {
    return handleSubscriptionError(c, error);
  }
});

subscriptionRoutes.post("/billing/payway/status", requireBearer, async (c) => {
  const authUser = getAuthUser(c);
  if (!authUser) return unauthorized(c);

  try {
    const body = await readJsonBody(c);
    const planId = parsePaidPlanId(body?.plan_id);
    const clientId = parseRequiredString(body?.client_id);
    const deviceId = parseRequiredString(body?.device_id);
    const requestTime = parseRequiredString(body?.request_time);
    const token = parseRequiredString(body?.token);

    if (!planId) {
      return c.json({ message: "plan_id must be starter or growth" }, 400);
    }
    if (!clientId || !deviceId || !requestTime || !token) {
      return c.json({ message: "Missing PayWay status check data." }, 400);
    }

    const result = await confirmSubscriptionPayment(authUser, {
      planId,
      clientId,
      deviceId,
      requestTime,
      token,
    });
    return c.json(result);
  } catch (error) {
    return handleSubscriptionError(c, error);
  }
});
