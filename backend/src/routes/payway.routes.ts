import { Hono } from "hono";
import {
  buildAbaMobileBankDeepLink,
  checkPaymentStatus,
  initPayment,
  isMobileDevice,
  PayWayHttpError,
  validatePaywayLinkUrl,
} from "@hezos/aba-payway-sdk";
import { resolveTenantFromHost } from "../middleware/resolve-tenant-from-host";
import { getTenantPaymentConfigBySubdomain } from "../services/tenant.service";

function normalizeAmount(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

export const paywayRoutes = new Hono();

paywayRoutes.post("/payway/init", resolveTenantFromHost, async (c) => {
  try {
    const subdomain = c.get("resolvedSubdomain");
    if (!subdomain) return c.json({ message: "No subdomain found in host" }, 400);

    const tenant = await getTenantPaymentConfigBySubdomain(subdomain);
    if (!tenant) return c.json({ message: "Store not found" }, 404);

    const paywayLinkUrl = typeof tenant.paywayLinkUrl === "string" ? tenant.paywayLinkUrl.trim() : "";
    if (!paywayLinkUrl) {
      return c.json({ message: "Tenant payway_link_url is not configured" }, 400);
    }

    const validLink = await validatePaywayLinkUrl({ paywayLinkUrl });
    if (!validLink.valid) {
      return c.json({ message: "Tenant payway_link_url is invalid" }, 400);
    }

    const body = await c.req.json().catch(() => null);
    const amount = normalizeAmount(body?.amount);
    const amountValue = Number(amount);
    if (!amount || !Number.isFinite(amountValue) || amountValue <= 0) {
      return c.json({ message: "Please enter an amount greater than 0." }, 400);
    }

    const paymentPayload = await initPayment({ amount, paywayLinkUrl });
    const qrString = typeof paymentPayload.qr_string === "string" ? paymentPayload.qr_string : "";
    const mobileDeepLink =
      qrString &&
      isMobileDevice({
        secChUaMobile: c.req.header("sec-ch-ua-mobile"),
        userAgent: c.req.header("user-agent"),
      })
        ? buildAbaMobileBankDeepLink(qrString)
        : undefined;

    return c.json({
      ...paymentPayload,
      payway_link_url: paywayLinkUrl,
      ...(mobileDeepLink ? { mobile_deep_link: mobileDeepLink } : {}),
    });
  } catch (error) {
    if (error instanceof PayWayHttpError) {
      return c.json(error.data, error.status as 400);
    }
    return c.json(
      { message: error instanceof Error ? error.message : "Unable to initialize payment." },
      500
    );
  }
});

paywayRoutes.post("/payway/status", async (c) => {
  try {
    const body = await c.req.json().catch(() => null);
    const clientId = normalizeAmount(body?.client_id);
    const deviceId = normalizeAmount(body?.device_id);
    const requestTime = normalizeAmount(body?.request_time);
    const token = normalizeAmount(body?.token);

    if (!clientId || !deviceId || !requestTime || !token) {
      return c.json({ message: "Missing PayWay status check data." }, 400);
    }

    const data = await checkPaymentStatus({
      clientId,
      deviceId,
      requestTime,
      token,
    });

    return c.json(data);
  } catch (error) {
    if (error instanceof PayWayHttpError) {
      return c.json(error.data, error.status as 400);
    }

    if (error instanceof DOMException && error.name === "TimeoutError") {
      return c.json({ message: "PayWay status check timed out. Please try again." }, 504);
    }

    return c.json(
      { message: error instanceof Error ? error.message : "Unable to check payment status." },
      500
    );
  }
});
