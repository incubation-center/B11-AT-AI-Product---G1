import { Hono } from "hono";
import { ragService } from "../services/rag.service";

export const ragRoutes = new Hono();

// Internal route: trigger indexing for a tenant
ragRoutes.post("/internal/rag/index/:tenantId", async (c) => {
  const tenantId = c.req.param("tenantId").trim();
  if (!tenantId) return c.json({ message: "tenantId is required" }, 400);

  try {
    await ragService.indexTenant(tenantId);
    return c.json({ message: "Indexing complete", tenantId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Indexing failed";
    return c.json({ message }, 500);
  }
});

// Internal route: search within a tenant's namespace
ragRoutes.post("/internal/rag/search", async (c) => {
  const body = await c.req.json().catch(() => null);
  const tenantId = typeof body?.tenantId === "string" ? body.tenantId.trim() : "";
  const query = typeof body?.query === "string" ? body.query.trim() : "";
  const topK = typeof body?.topK === "number" ? body.topK : 10;

  if (!tenantId) return c.json({ message: "tenantId is required" }, 400);
  if (!query) return c.json({ message: "query is required" }, 400);

  try {
    const matches = await ragService.searchTenant(tenantId, query, topK);
    return c.json({ matches: matches ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed";
    return c.json({ message }, 500);
  }
});
