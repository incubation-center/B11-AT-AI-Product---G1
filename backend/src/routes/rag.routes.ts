import { Hono } from "hono";
import type { Context } from "hono";
import { auth } from "../auth/config";
import { requireBearer } from "../middleware/require-bearer";
import { ragService } from "../services/rag.service";
import { getMyTenant } from "../services/tenant.service";

function cleanText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : null;
}

async function getSessionUser(c: Context) {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });
  return session?.user ?? null;
}

async function resolveTenant(c: Context): Promise<{ tenantId: string | null; response: Response | null }> {
  const sessionUser = await getSessionUser(c);
  if (!sessionUser) return { tenantId: null, response: c.json({ message: "Unauthorized" }, 401) };

  const tenant = await getMyTenant(sessionUser);
  if (!tenant) return { tenantId: null, response: c.json({ message: "Tenant not found" }, 404) };

  return { tenantId: tenant.id, response: null };
}

export const ragRoutes = new Hono();

ragRoutes.post("/rag/index/tenant", requireBearer, async (c) => {
  const resolved = await resolveTenant(c);
  if (resolved.response) return resolved.response;
  const tenantId = resolved.tenantId!;

  await ragService.indexTenant(tenantId);
  return c.json({ message: "Tenant index refreshed", tenant_id: tenantId });
});

ragRoutes.post("/rag/index/product/:id", requireBearer, async (c) => {
  const resolved = await resolveTenant(c);
  if (resolved.response) return resolved.response;
  const tenantId = resolved.tenantId!;

  const productId = cleanText(c.req.param("id"));
  if (!productId) return c.json({ message: "product id is required" }, 400);

  await ragService.reindexProduct(tenantId, productId);
  return c.json({ message: "Product index refreshed", tenant_id: tenantId, product_id: productId });
});

ragRoutes.delete("/rag/index/product/:id", requireBearer, async (c) => {
  const resolved = await resolveTenant(c);
  if (resolved.response) return resolved.response;
  const tenantId = resolved.tenantId!;

  const productId = cleanText(c.req.param("id"));
  if (!productId) return c.json({ message: "product id is required" }, 400);

  await ragService.deleteProductVector(tenantId, productId);
  return c.json({ message: "Product vector deleted", tenant_id: tenantId, product_id: productId });
});
