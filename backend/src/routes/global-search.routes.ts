import { Hono } from "hono";
import { streamText } from "hono/streaming";
import { GLOBAL_SEARCH_SYSTEM_PROMPT, globalProductSearch } from "../services/global-search.service";
import { env } from "../env";

export const globalSearchRoutes = new Hono();

function cleanMessage(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim();
  return t.length > 0 ? t : null;
}

globalSearchRoutes.post("/global/chat", async (c) => {
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
