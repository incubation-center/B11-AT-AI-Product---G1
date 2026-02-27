import { Hono } from "hono";
import type { Context } from "hono";
import { askBuyerAssistant } from "../services/assistant.service";
import { getStoreBySubdomain } from "../services/tenant.service";

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

export const assistantRoutes = new Hono();

assistantRoutes.post("/assistant/ask", async (c) => {
  const body = await c.req.json().catch(() => null);
  const question = cleanText(body?.question);
  if (!question) return c.json({ message: "question is required" }, 400);

  const subdomainFromBody = cleanText(body?.subdomain)?.toLowerCase() ?? null;
  const subdomainFromHost = extractSubdomain(stripPort(getRequestHost(c)));
  const subdomain = subdomainFromBody ?? subdomainFromHost;
  if (!subdomain) return c.json({ message: "subdomain is required (body or host)" }, 400);

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
