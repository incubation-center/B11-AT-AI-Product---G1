import { Hono } from "hono";
import type { Context } from "hono";
import { checkPaymentStatus, PayWayHttpError } from "@hezos/aba-payway-sdk";
import { auth } from "../auth/config";
import { requireBearer } from "../middleware/require-bearer";
import {
  cancelOwnerOrder,
  createCheckoutOrder,
  getOwnerOrderById,
  listOwnerOrders,
  updateOwnerOrderPayment,
  updateOwnerOrderStatus,
} from "../services/order.service";
import { getMyTenant, getStoreBySubdomain } from "../services/tenant.service";

type OrderStatus = "pending" | "confirmed" | "delivering" | "completed" | "cancelled";
type PaymentStatus = "unpaid" | "paid" | "refunded";
type PaymentMethod = "cod" | "aba_transfer";

const orderStatusSet = new Set<OrderStatus>(["pending", "confirmed", "delivering", "completed", "cancelled"]);
const paymentStatusSet = new Set<PaymentStatus>(["unpaid", "paid", "refunded"]);
const paymentMethodSet = new Set<PaymentMethod>(["cod", "aba_transfer"]);

function cleanText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toInteger(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && /^-?\d+$/.test(value.trim())) {
    return Number.parseInt(value.trim(), 10);
  }
  return null;
}

function getRecordValue(value: unknown, key: string): unknown {
  if (!value || typeof value !== "object") return undefined;
  return (value as Record<string, unknown>)[key];
}

function getNestedValue(value: unknown, path: string[]): unknown {
  let current = value;
  for (const key of path) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function getPaywayStatusMessage(value: unknown): string {
  return (
    cleanText(getNestedValue(value, ["status", "message"])) ??
    cleanText(getNestedValue(value, ["data", "message", "message"])) ??
    cleanText(getNestedValue(value, ["message"])) ??
    cleanText(getNestedValue(value, ["action"])) ??
    cleanText(getNestedValue(value, ["data", "action"])) ??
    ""
  );
}

function getPaywayAction(value: unknown): string | null {
  return (
    cleanText(getNestedValue(value, ["data", "action"])) ??
    cleanText(getNestedValue(value, ["action"]))
  );
}

function getPaywayTransactionId(value: unknown): string | null {
  return (
    cleanText(getNestedValue(value, ["status", "tran_id"])) ??
    cleanText(getNestedValue(value, ["data", "message", "tran_id"]))
  );
}

function isPaywayPaymentSuccess(value: unknown): boolean {
  return getPaywayAction(value)?.trim().toLowerCase() === "approved";
}

function getRequestHost(c: Context): string {
  const forwardedHost = c.req.header("x-forwarded-host");
  const host = forwardedHost || c.req.header("host") || "";
  return host.trim().toLowerCase();
}

function stripPort(host: string): string {
  return host.replace(/:\d+$/, "");
}

function extractSubdomain(hostname: string): string | null {
  if (!hostname || hostname === "localhost" || hostname === "127.0.0.1") return null;

  if (hostname.endsWith(".localhost")) {
    return hostname.slice(0, -".localhost".length) || null;
  }
  if (hostname.endsWith(".lvh.me")) {
    return hostname.slice(0, -".lvh.me".length) || null;
  }
  if (hostname.endsWith(".127.0.0.1.nip.io")) {
    return hostname.slice(0, -".127.0.0.1.nip.io".length) || null;
  }

  const parts = hostname.split(".");
  if (parts.length < 3) return null;
  return parts[0] || null;
}

async function getSessionUser(c: Context) {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });
  return session?.user ?? null;
}

async function resolveOwnerTenantId(c: Context): Promise<{ tenantId: string | null; response: Response | null }> {
  const sessionUser = await getSessionUser(c);
  if (!sessionUser) return { tenantId: null, response: c.json({ message: "Unauthorized" }, 401) };

  const tenant = await getMyTenant(sessionUser);
  if (!tenant) return { tenantId: null, response: c.json({ message: "Tenant not found" }, 404) };
  return { tenantId: tenant.id, response: null };
}

async function resolveTenantFromHost(c: Context): Promise<{ tenantId: string | null; response: Response | null }> {
  const hostname = stripPort(getRequestHost(c));
  const subdomain = extractSubdomain(hostname);
  if (!subdomain) {
    return { tenantId: null, response: c.json({ message: "No subdomain found in host" }, 400) };
  }

  const tenant = await getStoreBySubdomain(subdomain);
  if (!tenant) return { tenantId: null, response: c.json({ message: "Store not found" }, 404) };

  return { tenantId: tenant.id, response: null };
}

export const orderRoutes = new Hono();

orderRoutes.post("/checkout", async (c) => {
  const resolved = await resolveTenantFromHost(c);
  if (resolved.response) return resolved.response;
  const tenantId = resolved.tenantId!;

  const body = await c.req.json().catch(() => null);
  const customerName = cleanText(body?.customer_name);
  const addressText = cleanText(body?.address_text);
  const paymentMethod = cleanText(body?.payment_method);
  const currency = cleanText(body?.currency);
  const items = Array.isArray(body?.items) ? body.items : null;

  if (!customerName) return c.json({ message: "customer_name is required" }, 400);
  if (!addressText) return c.json({ message: "address_text is required" }, 400);
  if (!paymentMethod || !paymentMethodSet.has(paymentMethod as PaymentMethod)) {
    return c.json({ message: "payment_method is invalid" }, 400);
  }
  if (currency !== "USD" && currency !== "KHR") {
    return c.json({ message: "currency must be USD or KHR" }, 400);
  }
  if (!items || items.length === 0) {
    return c.json({ message: "items is required" }, 400);
  }

  const normalizedItems = items.map((item: any) => ({
    product_id: cleanText(item?.product_id) ?? "",
    variant_id: cleanText(item?.variant_id),
    qty: toInteger(item?.qty) ?? 0,
  }));

  if (normalizedItems.some((item: { product_id: string; qty: number }) => !item.product_id || item.qty <= 0)) {
    return c.json({ message: "Each item requires product_id and qty > 0" }, 400);
  }

  try {
    let verifiedPaywayReference: string | null = null;

    if (paymentMethod === "aba_transfer") {
      const payway = body?.payway && typeof body.payway === "object" ? body.payway : body;
      const clientId = cleanText(getRecordValue(payway, "client_id"));
      const deviceId = cleanText(getRecordValue(payway, "device_id"));
      const requestTime = cleanText(getRecordValue(payway, "request_time"));
      const token = cleanText(getRecordValue(payway, "token"));

      if (!clientId || !deviceId || !requestTime || !token) {
        return c.json({ message: "Confirmed ABA payment data is required before checkout" }, 400);
      }

      const paywayStatus = await checkPaymentStatus({
        clientId,
        deviceId,
        requestTime,
        token,
      });

      if (!isPaywayPaymentSuccess(paywayStatus)) {
        return c.json({ message: "ABA payment is not confirmed yet" }, 402);
      }

      verifiedPaywayReference = getPaywayTransactionId(paywayStatus);
    }

    const order = await createCheckoutOrder(tenantId, {
      customer_name: customerName,
      customer_phone: cleanText(body?.customer_phone),
      address_text: addressText,
      google_map_url: cleanText(body?.google_map_url),
      payment_method: paymentMethod as PaymentMethod,
      payment_status: paymentMethod === "aba_transfer" ? "paid" : "unpaid",
      payment_reference: verifiedPaywayReference,
      paid_at: paymentMethod === "aba_transfer" ? new Date().toISOString() : null,
      currency,
      notes: cleanText(body?.notes),
      items: normalizedItems,
    });

    return c.json({ message: "Checkout created", order }, 201);
  } catch (error) {
    if (error instanceof PayWayHttpError) {
      return c.json(error.data, error.status as 400);
    }

    const message = error instanceof Error ? error.message : "Unable to create checkout";
    return c.json({ message }, 400);
  }
});

orderRoutes.get("/orders", requireBearer, async (c) => {
  const resolved = await resolveOwnerTenantId(c);
  if (resolved.response) return resolved.response;
  const tenantId = resolved.tenantId!;

  const orders = await listOwnerOrders(tenantId, {
    status: c.req.query("status"),
    from: c.req.query("from"),
    to: c.req.query("to"),
  });

  return c.json({ orders });
});

orderRoutes.get("/orders/:id", requireBearer, async (c) => {
  const resolved = await resolveOwnerTenantId(c);
  if (resolved.response) return resolved.response;
  const tenantId = resolved.tenantId!;

  const orderId = cleanText(c.req.param("id"));
  if (!orderId) return c.json({ message: "order id is required" }, 400);

  const order = await getOwnerOrderById(tenantId, orderId);
  if (!order) return c.json({ message: "Order not found" }, 404);

  return c.json({ order });
});

orderRoutes.patch("/orders/:id/status", requireBearer, async (c) => {
  const resolved = await resolveOwnerTenantId(c);
  if (resolved.response) return resolved.response;
  const tenantId = resolved.tenantId!;

  const orderId = cleanText(c.req.param("id"));
  if (!orderId) return c.json({ message: "order id is required" }, 400);

  const body = await c.req.json().catch(() => null);
  const status = cleanText(body?.status);
  if (!status || !orderStatusSet.has(status as OrderStatus)) {
    return c.json({ message: "status is invalid" }, 400);
  }

  try {
    const order = await updateOwnerOrderStatus(tenantId, orderId, status as OrderStatus);
    return c.json({ message: "Order status updated", order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update order status";
    const statusCode = message === "Order not found" ? 404 : 400;
    return c.json({ message }, statusCode);
  }
});

orderRoutes.patch("/orders/:id/payment", requireBearer, async (c) => {
  const resolved = await resolveOwnerTenantId(c);
  if (resolved.response) return resolved.response;
  const tenantId = resolved.tenantId!;

  const orderId = cleanText(c.req.param("id"));
  if (!orderId) return c.json({ message: "order id is required" }, 400);

  const body = await c.req.json().catch(() => null);
  const paymentStatus = cleanText(body?.payment_status);
  const method = cleanText(body?.method);

  if (!paymentStatus || !paymentStatusSet.has(paymentStatus as PaymentStatus)) {
    return c.json({ message: "payment_status is invalid" }, 400);
  }
  if (method && !paymentMethodSet.has(method as PaymentMethod)) {
    return c.json({ message: "method is invalid" }, 400);
  }

  try {
    const order = await updateOwnerOrderPayment(tenantId, orderId, {
      payment_status: paymentStatus as PaymentStatus,
      method: (method as PaymentMethod | null) ?? undefined,
      amount: body?.amount ?? null,
      reference: cleanText(body?.reference),
      paid_at: cleanText(body?.paid_at),
    });
    return c.json({ message: "Order payment updated", order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update payment";
    const statusCode = message === "Order not found" ? 404 : 400;
    return c.json({ message }, statusCode);
  }
});

orderRoutes.post("/orders/:id/cancel", requireBearer, async (c) => {
  const resolved = await resolveOwnerTenantId(c);
  if (resolved.response) return resolved.response;
  const tenantId = resolved.tenantId!;

  const orderId = cleanText(c.req.param("id"));
  if (!orderId) return c.json({ message: "order id is required" }, 400);

  try {
    const order = await cancelOwnerOrder(tenantId, orderId);
    return c.json({ message: "Order cancelled", order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to cancel order";
    const statusCode = message === "Order not found" ? 404 : 400;
    return c.json({ message }, statusCode);
  }
});
