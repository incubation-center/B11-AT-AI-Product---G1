import {
  buildAbaMobileBankDeepLink,
  checkPaymentStatus,
  initPayment,
  isMobileDevice,
  validatePaywayLinkUrl,
} from "@hezos/aba-payway-sdk";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "../db";
import { subscriptions } from "../db/schema";
import { env } from "../env";
import type { SessionUser } from "../types/auth";
import {
  SUBSCRIPTION_PLANS,
  type PaidSubscriptionPlanId,
  type SubscriptionPlanId,
  type SubscriptionSummary,
} from "../types/subscription";
import { getMyTenant } from "./tenant.service";

type SubscriptionRow = typeof subscriptions.$inferSelect;
const CURRENT_SUBSCRIPTION_STATUSES = ["trialing", "active", "past_due"] as const;

type ConfirmSubscriptionPaymentInput = {
  planId: PaidSubscriptionPlanId;
  clientId: string;
  deviceId: string;
  requestTime: string;
  token: string;
};

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function normalizePaywayField(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  if (typeof value === "number") {
    return String(value);
  }
  return null;
}

function getPaywayField(payload: unknown, camelKey: string, snakeKey: string): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const record = payload as Record<string, unknown>;
  return normalizePaywayField(record[camelKey]) ?? normalizePaywayField(record[snakeKey]);
}

function getPaywayExpirySeconds(payload: unknown): number | null {
  const raw = getPaywayField(payload, "expireInSec", "expire_in_sec");
  if (!raw) {
    return null;
  }

  const seconds = Number.parseInt(raw, 10);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}

function generatePaywayDeviceId(): string {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);

  return Array.from(bytes, (byte) => characters[byte % characters.length]).join("");
}

function isApprovedPaymentStatus(status: unknown): boolean {
  if (!status || typeof status !== "object") {
    return false;
  }
  const record = status as { action?: unknown; data?: { action?: unknown } };
  const actions = `${typeof record.action === "string" ? record.action : ""} ${
    typeof record.data?.action === "string" ? record.data.action : ""
  }`;

  return actions
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .includes("approved");
}

function getPlanCapabilities(planId: SubscriptionPlanId) {
  const plan = SUBSCRIPTION_PLANS[planId];
  return {
    productLimit: plan.productLimit,
    aiMonthlyLimit: plan.aiMonthlyLimit,
    removeBranding: plan.removeBranding,
  };
}

export function toSubscriptionSummary(subscription: SubscriptionRow | null): SubscriptionSummary | null {
  if (!subscription) {
    return null;
  }

  const plan = subscription.plan as SubscriptionPlanId;
  const now = new Date();
  const isAccessActive =
    (subscription.status === "trialing" || subscription.status === "active") &&
    subscription.currentPeriodEnd.getTime() > now.getTime();

  return {
    id: subscription.id,
    plan,
    status: subscription.status,
    amountUsd: Number(subscription.amountUsd),
    trialEndsAt: subscription.trialEndsAt,
    currentPeriodEnd: subscription.currentPeriodEnd,
    isAccessActive,
    capabilities: getPlanCapabilities(plan),
  };
}

export async function getCurrentSubscriptionByTenantId(tenantId: string) {
  return db.query.subscriptions.findFirst({
    where: and(
      eq(subscriptions.tenantId, tenantId),
      inArray(subscriptions.status, [...CURRENT_SUBSCRIPTION_STATUSES])
    ),
    orderBy: [desc(subscriptions.createdAt)],
  });
}

async function getCurrentStatusSubscriptionByTenantId(tenantId: string) {
  return db.query.subscriptions.findFirst({
    where: and(
      eq(subscriptions.tenantId, tenantId),
      inArray(subscriptions.status, [...CURRENT_SUBSCRIPTION_STATUSES])
    ),
    orderBy: [desc(subscriptions.createdAt)],
  });
}

async function getLatestPendingPaymentSubscriptionByTenantId(tenantId: string) {
  return db.query.subscriptions.findFirst({
    where: and(eq(subscriptions.tenantId, tenantId), eq(subscriptions.status, "payment_pending")),
    orderBy: [desc(subscriptions.createdAt)],
  });
}

export async function getMySubscriptionSummary(authUser: SessionUser) {
  const tenant = await getMyTenant(authUser);
  if (!tenant) {
    return { tenant, subscription: null };
  }

  const subscription = await getCurrentSubscriptionByTenantId(tenant.id);
  return {
    tenant,
    subscription: toSubscriptionSummary(subscription ?? null),
  };
}

export async function startTrialSubscription(authUser: SessionUser) {
  const tenant = await getMyTenant(authUser);
  if (!tenant) {
    throw new Error("Tenant is required to start a subscription trial.");
  }

  const existing = await getCurrentStatusSubscriptionByTenantId(tenant.id);
  if (existing) {
    return toSubscriptionSummary(existing);
  }

  const pendingPayment = await getLatestPendingPaymentSubscriptionByTenantId(tenant.id);
  if (pendingPayment) {
    const now = new Date();
    const trialEndsAt = addDays(now, SUBSCRIPTION_PLANS.free_trial.trialDays);
    const updated = await db
      .update(subscriptions)
      .set({
        plan: "free_trial",
        status: "trialing",
        amountUsd: String(SUBSCRIPTION_PLANS.free_trial.amountUsd),
        paywayClientId: null,
        paywayDeviceId: null,
        paywayRequestTime: null,
        paywayToken: null,
        trialEndsAt,
        currentPeriodStart: now,
        currentPeriodEnd: trialEndsAt,
        updatedAt: now,
      })
      .where(eq(subscriptions.id, pendingPayment.id))
      .returning();

    return toSubscriptionSummary(updated[0] ?? pendingPayment);
  }

  const now = new Date();
  const trialEndsAt = addDays(now, SUBSCRIPTION_PLANS.free_trial.trialDays);
  const inserted = await db
    .insert(subscriptions)
    .values({
      tenantId: tenant.id,
      plan: "free_trial",
      status: "trialing",
      amountUsd: String(SUBSCRIPTION_PLANS.free_trial.amountUsd),
      startedAt: now,
      trialEndsAt,
      currentPeriodStart: now,
      currentPeriodEnd: trialEndsAt,
      updatedAt: now,
    })
    .returning();

  return toSubscriptionSummary(inserted[0] ?? null);
}

export async function initSubscriptionPayment(
  authUser: SessionUser,
  planId: PaidSubscriptionPlanId,
  headers: Headers
) {
  const tenant = await getMyTenant(authUser);
  if (!tenant) {
    throw new Error("Tenant is required to initialize subscription payment.");
  }

  const plan = SUBSCRIPTION_PLANS[planId];
  const paywayLinkUrl = env.PAYWAY_LINK_URL?.trim();
  if (!paywayLinkUrl) {
    throw new Error("PAYWAY_LINK_URL is required for subscription payments");
  }

  const validLink = await validatePaywayLinkUrl({ paywayLinkUrl });
  if (!validLink.valid) {
    throw new Error("PAYWAY_LINK_URL is invalid");
  }

  const paymentPayload = await initPayment({ amount: String(plan.amountUsd), paywayLinkUrl });
  const paywayClientId = getPaywayField(paymentPayload, "clientId", "client_id");
  const paywayDeviceId =
    getPaywayField(paymentPayload, "deviceId", "device_id") ?? generatePaywayDeviceId();
  const paywayRequestTime = getPaywayField(paymentPayload, "requestTime", "request_time");
  const paywayToken = getPaywayField(paymentPayload, "token", "token");
  const now = new Date();
  const paywayExpirySeconds = getPaywayExpirySeconds(paymentPayload);
  const paywayExpiresAt = paywayExpirySeconds
    ? new Date(now.getTime() + paywayExpirySeconds * 1000).toISOString()
    : null;
  const currentSubscription = await getCurrentStatusSubscriptionByTenantId(tenant.id);

  const qrString = getPaywayField(paymentPayload, "qrString", "qr_string");
  const mobileDeepLink =
    qrString &&
    isMobileDevice({
      secChUaMobile: headers.get("sec-ch-ua-mobile") ?? undefined,
      userAgent: headers.get("user-agent") ?? undefined,
    })
      ? buildAbaMobileBankDeepLink(qrString)
      : undefined;

  return {
    subscription: toSubscriptionSummary(currentSubscription ?? null),
    payment: {
      ...(paymentPayload as Record<string, unknown>),
      plan_id: planId,
      client_id: paywayClientId,
      device_id: paywayDeviceId,
      request_time: paywayRequestTime,
      token: paywayToken,
      payway_link_url: paywayLinkUrl,
      payway_expires_at: paywayExpiresAt,
      server_time: now.toISOString(),
      ...(mobileDeepLink ? { mobile_deep_link: mobileDeepLink } : {}),
    },
  };
}

export async function confirmSubscriptionPayment(
  authUser: SessionUser,
  input: ConfirmSubscriptionPaymentInput
) {
  const tenant = await getMyTenant(authUser);
  if (!tenant) {
    throw new Error("Tenant not found");
  }

  const status = await checkPaymentStatus({
    clientId: input.clientId,
    deviceId: input.deviceId,
    requestTime: input.requestTime,
    token: input.token,
  });

  const currentSubscription = await getCurrentStatusSubscriptionByTenantId(tenant.id);

  if (!isApprovedPaymentStatus(status)) {
    return {
      subscription: toSubscriptionSummary(currentSubscription ?? null),
      paywayStatus: status,
    };
  }

  const now = new Date();
  const currentPeriodEnd = addDays(now, 30);
  const plan = SUBSCRIPTION_PLANS[input.planId];
  const values = {
    plan: input.planId,
    status: "active" as const,
    amountUsd: String(plan.amountUsd),
    paywayClientId: input.clientId,
    paywayDeviceId: input.deviceId,
    paywayRequestTime: input.requestTime,
    paywayToken: input.token,
    trialEndsAt: null,
    currentPeriodStart: now,
    currentPeriodEnd,
    updatedAt: now,
  };
  const updated = currentSubscription
    ? await db
        .update(subscriptions)
        .set(values)
        .where(and(eq(subscriptions.id, currentSubscription.id), eq(subscriptions.tenantId, tenant.id)))
        .returning()
    : await db
        .insert(subscriptions)
        .values({
          tenantId: tenant.id,
          ...values,
          startedAt: now,
        })
        .returning();

  return {
    subscription: toSubscriptionSummary(updated[0] ?? currentSubscription ?? null),
    paywayStatus: status,
  };
}

export async function getSubscriptionAccessForTenant(tenantId: string) {
  const subscription = await getCurrentSubscriptionByTenantId(tenantId);
  const summary = toSubscriptionSummary(subscription ?? null);
  if (!summary || !summary.isAccessActive) {
    return {
      allowed: false,
      reason: "Subscription is required",
      productLimit: 0,
      aiMonthlyLimit: 0,
    };
  }

  return {
    allowed: true,
    reason: null,
    productLimit: summary.capabilities.productLimit,
    aiMonthlyLimit: summary.capabilities.aiMonthlyLimit,
  };
}
