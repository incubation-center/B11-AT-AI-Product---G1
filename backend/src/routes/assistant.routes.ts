import { Hono } from "hono";
import type { Context } from "hono";
import { askBuyerAssistant } from "../services/assistant.service";
import { getStoreBySubdomain } from "../services/tenant.service";

const ASSISTANT_RATE_LIMIT_WINDOW_MS = 60_000;
const ASSISTANT_RATE_LIMIT_MAX_REQUESTS = 20;
const assistantRateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

function cleanText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : null;
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
  if (hostname.endsWith(".localhost")) return hostname.slice(0, -".localhost".length) || null;
  if (hostname.endsWith(".lvh.me")) return hostname.slice(0, -".lvh.me".length) || null;
  if (hostname.endsWith(".127.0.0.1.nip.io")) return hostname.slice(0, -".127.0.0.1.nip.io".length) || null;
  const parts = hostname.split(".");
  return parts.length >= 3 ? parts[0] || null : null;
}

function getClientIp(c: Context): string {
  const forwardedFor = c.req.header("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  return (
    c.req.header("cf-connecting-ip") ??
    c.req.header("x-real-ip") ??
    c.req.header("x-client-ip") ??
    "unknown"
  );
}

function enforceAssistantRateLimit(c: Context, subdomain: string): Response | null {
  const now = Date.now();
  const bucketKey = `${subdomain}:${getClientIp(c)}`;
  const current = assistantRateLimitBuckets.get(bucketKey);

  if (!current || now >= current.resetAt) {
    assistantRateLimitBuckets.set(bucketKey, {
      count: 1,
      resetAt: now + ASSISTANT_RATE_LIMIT_WINDOW_MS,
    });
    return null;
  }

  if (current.count >= ASSISTANT_RATE_LIMIT_MAX_REQUESTS) {
    const retryAfterSec = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    c.header("Retry-After", String(retryAfterSec));
    return c.json(
      {
        message: "Too many assistant requests. Please try again shortly.",
        retry_after_seconds: retryAfterSec,
      },
      429
    );
  }

  current.count += 1;
  assistantRateLimitBuckets.set(bucketKey, current);
  return null;
}

export const assistantRoutes = new Hono();

assistantRoutes.post("/assistant/ask", async (c) => {
  const body = await c.req.json().catch(() => null);
  const question = cleanText(body?.question);
  if (!question) return c.json({ message: "question is required" }, 400);

  const subdomainFromBody = cleanText(body?.subdomain)?.toLowerCase() ?? null;
  const subdomainFromHost = extractSubdomain(stripPort(getRequestHost(c)));
  const subdomain = subdomainFromBody ?? subdomainFromHost;
  if (!subdomain) return c.json({ message: "subdomain is required (body or host)" }, 400);

  const rateLimited = enforceAssistantRateLimit(c, subdomain);
  if (rateLimited) return rateLimited;

  const tenant = await getStoreBySubdomain(subdomain);
  if (!tenant) return c.json({ message: "Store not found" }, 404);

  try {
    const result = await askBuyerAssistant({
      tenantId: tenant.id,
      question,
      language: cleanText(body?.language),
      sessionId: cleanText(body?.session_id),
      anonymousId: cleanText(body?.anonymous_id),
    });

    return c.json({
      message: "Answer generated",
      session_id: result.sessionId,
      answer: result.answer,
      language: result.language,
      confidence: result.confidence,
      low_confidence: result.lowConfidence,
      sources: result.sources,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to answer question";
    return c.json({ message }, 400);
  }
});
