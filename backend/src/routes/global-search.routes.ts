import { Hono } from "hono";
import type { Context } from "hono";
import { streamText } from "hono/streaming";
import { GLOBAL_SEARCH_SYSTEM_PROMPT, globalProductSearch } from "../services/global-search.service";
import { env } from "../env";

export const globalSearchRoutes = new Hono();
const GLOBAL_CHAT_RATE_LIMIT_WINDOW_MS = 60_000;
const GLOBAL_CHAT_RATE_LIMIT_MAX_REQUESTS = 20;
const globalChatRateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

function cleanMessage(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim();
  return t.length > 0 ? t : null;
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

function enforceGlobalChatRateLimit(c: Context): Response | null {
  const now = Date.now();
  const bucketKey = getClientIp(c);
  const current = globalChatRateLimitBuckets.get(bucketKey);

  if (!current || now >= current.resetAt) {
    globalChatRateLimitBuckets.set(bucketKey, {
      count: 1,
      resetAt: now + GLOBAL_CHAT_RATE_LIMIT_WINDOW_MS,
    });
    return null;
  }

  if (current.count >= GLOBAL_CHAT_RATE_LIMIT_MAX_REQUESTS) {
    const retryAfterSec = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    c.header("Retry-After", String(retryAfterSec));
    return c.json(
      {
        message: "Too many AI requests. Please try again shortly.",
        retry_after_seconds: retryAfterSec,
      },
      429
    );
  }

  current.count += 1;
  globalChatRateLimitBuckets.set(bucketKey, current);
  return null;
}

globalSearchRoutes.post("/global/chat", async (c) => {
  const rateLimited = enforceGlobalChatRateLimit(c);
  if (rateLimited) return rateLimited;

  const body = await c.req.json().catch(() => null);

  // Accept Vercel AI SDK's `messages` array OR a simple `message` string
  let userMessage: string | null = null;
  if (Array.isArray(body?.messages) && body.messages.length > 0) {
    const last = body.messages[body.messages.length - 1];
    userMessage = cleanMessage(last?.content);
  } else {
    userMessage = cleanMessage(body?.message);
  }

  if (!userMessage) {
    return c.json({ message: "message is required" }, 400);
  }

  if (!env.OPEN_AI_API) {
    return c.json({ message: "AI service is not configured" }, 503);
  }

  // 1. Search Pinecone globally for matching products
  let searchResults = await globalProductSearch(userMessage, 8);

  // 2. Build the context block from search results
  const contextBlock =
    searchResults.length > 0
      ? searchResults
          .map(
            (r, i) =>
              `[Result ${i + 1}] Product: "${r.productName}" | Shop: "${r.shopName}" | Store URL: ${r.storeUrl} | Price USD: ${r.priceUsd || "N/A"} | Category: ${r.category || "N/A"} | Score: ${r.score.toFixed(3)}\nDetails: ${r.text.slice(0, 300)}`
          )
          .join("\n\n")
      : "No matching products found in the Coolhat store catalog.";

  // 3. Build messages for OpenAI
  const messages = [
    { role: "system", content: GLOBAL_SEARCH_SYSTEM_PROMPT },
    {
      role: "user",
      content: `User query: "${userMessage}"\n\n--- Product Search Results from Coolhat Catalog ---\n${contextBlock}\n\nBased ONLY on the above results, help the user find what they need. Include clickable store links in your response.`,
    },
  ];

  // 4. Stream the response back
  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPEN_AI_API}`,
    },
    body: JSON.stringify({
      model: env.OPEN_AI_MODEL,
      messages,
      temperature: 0.15,
      stream: true,
    }),
  });

  if (!openaiRes.ok || !openaiRes.body) {
    const raw = await openaiRes.text();
    return c.json({ message: `AI service error: ${raw}` }, 502);
  }

  // Stream OpenAI SSE back to frontend as plain text stream
  c.header("Content-Type", "text/plain; charset=utf-8");
  c.header("X-Vercel-AI-Data-Stream", "v1");
  c.header("Transfer-Encoding", "chunked");

  return streamText(c, async (stream) => {
    const reader = openaiRes.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

      for (const line of lines) {
        const data = line.slice(6).trim();
        if (data === "[DONE]") break;

        try {
          const parsed = JSON.parse(data) as {
            choices?: Array<{ delta?: { content?: string } }>;
          };
          const token = parsed.choices?.[0]?.delta?.content;
          if (token) {
            // Format as Vercel AI SDK data stream protocol
            await stream.write(`0:${JSON.stringify(token)}\n`);
          }
        } catch {
          // skip malformed SSE lines
        }
      }
    }
  });
});
