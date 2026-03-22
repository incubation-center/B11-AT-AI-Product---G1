import { Hono } from "hono";
import type { Context } from "hono";
import { auth } from "../auth/config";
import { requireBearer } from "../middleware/require-bearer";
import { getAnalyticsSummary, type AnalyticsSummaryFilter } from "../services/analytics.service";
import { getMyTenant } from "../services/tenant.service";

async function getSessionUser(c: Context) {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });
  return session?.user ?? null;
}

async function resolveOwnerTenantId(c: Context): Promise<{ tenantId: string | null; response: Response | null }> {
  const sessionUser = await getSessionUser(c);
  if (!sessionUser) {
    return { tenantId: null, response: c.json({ message: "Unauthorized" }, 401) };
  }

  const tenant = await getMyTenant(sessionUser);
  if (!tenant) {
    return { tenantId: null, response: c.json({ message: "Tenant not found" }, 404) };
  }

  return { tenantId: tenant.id, response: null };
}

function parseOptionalInteger(value: string | undefined): number | null {
  if (!value) return null;
  if (!/^\d+$/.test(value.trim())) return null;
  return Number.parseInt(value.trim(), 10);
}

function getAnalyticsFilter(c: Context): { filter: AnalyticsSummaryFilter | null; response: Response | null } {
  const monthQuery = c.req.query("month");
  const yearQuery = c.req.query("year");

  if (!monthQuery && !yearQuery) {
    return { filter: {}, response: null };
  }

  const month = parseOptionalInteger(monthQuery);
  const year = parseOptionalInteger(yearQuery);

  if (month === null || year === null) {
    return {
      filter: null,
      response: c.json({ message: "month and year must be valid integers" }, 400),
    };
  }

  if (month < 1 || month > 12) {
    return {
      filter: null,
      response: c.json({ message: "month must be between 1 and 12" }, 400),
    };
  }

  if (year < 1000 || year > 9999) {
    return {
      filter: null,
      response: c.json({ message: "year must be a 4-digit year" }, 400),
    };
  }

  return {
    filter: { month, year },
    response: null,
  };
}

export const analyticsRoutes = new Hono();

analyticsRoutes.get("/analytics/summary", requireBearer, async (c) => {
  const resolved = await resolveOwnerTenantId(c);
  if (resolved.response) {
    return resolved.response;
  }

  const filterResult = getAnalyticsFilter(c);
  if (filterResult.response) {
    return filterResult.response;
  }

  try {
    const summary = await getAnalyticsSummary(resolved.tenantId!, filterResult.filter ?? {});
    return c.json(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load analytics summary";
    return c.json({ message }, 500);
  }
});