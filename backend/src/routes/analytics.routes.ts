import { Hono } from "hono";
import type { Context } from "hono";
import { auth } from "../auth/config";
import { env } from "../env";
import { requireBearer } from "../middleware/require-bearer";
import {
  getBillingSummary,
  getAnalyticsSummary,
  getOverdueOrdersByMonthYear,
  getStorePerformanceSummary,
  type AnalyticsSummaryFilter,
} from "../services/analytics.service";
import { getMyTenant, getTenantById } from "../services/tenant.service";

async function getSessionUser(c: Context) {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });
  return session?.user ?? null;
}

async function resolveOwnerTenantId(c: Context): Promise<{ tenantId: string | null; response: Response | null }> {
  const sessionUser = await getSessionUser(c);

  if (!sessionUser) {
    if (env.NODE_ENV === "development") {
      const tenantId = c.req.query("tenantId")?.trim();
      if (!tenantId) {
        return {
          tenantId: null,
          response: c.json(
            { message: "Unauthorized. For local testing in development, provide tenantId query parameter." },
            401
          ),
        };
      }

      const tenant = await getTenantById(tenantId);
      if (!tenant) {
        return { tenantId: null, response: c.json({ message: "Tenant not found" }, 404) };
      }

      return { tenantId: tenant.id, response: null };
    }

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

analyticsRoutes.get("/analytics/summary", async (c) => {
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

analyticsRoutes.get("/analytics/overdue", requireBearer, async (c) => {
  const resolved = await resolveOwnerTenantId(c);
  if (resolved.response) {
    return resolved.response;
  }

  const monthQuery = c.req.query("month");
  const yearQuery = c.req.query("year");

  const month = parseOptionalInteger(monthQuery);
  const year = parseOptionalInteger(yearQuery);

  // Validate month/year if provided
  if (monthQuery && month === null) {
    return c.json({ message: "month must be a valid integer" }, 400);
  }
  if (yearQuery && year === null) {
    return c.json({ message: "year must be a valid integer" }, 400);
  }
  if (month !== null && (month < 1 || month > 12)) {
    return c.json({ message: "month must be between 1 and 12" }, 400);
  }
  if (year !== null && (year < 1000 || year > 9999)) {
    return c.json({ message: "year must be a 4-digit year" }, 400);
  }

  try {
    const summary = await getOverdueOrdersByMonthYear(
      resolved.tenantId!,
      month ?? undefined,
      year ?? undefined
    );
    return c.json(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load overdue orders summary";
    return c.json({ message }, 500);
  }
});

analyticsRoutes.get("/analytics/billing", requireBearer, async (c) => {
  const resolved = await resolveOwnerTenantId(c);
  if (resolved.response) {
    return resolved.response;
  }

  try {
    const summary = await getBillingSummary(resolved.tenantId!);
    return c.json(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load billing summary";
    return c.json({ message }, 500);
  }
});

analyticsRoutes.get("/analytics/store-performance", requireBearer, async (c) => {
  const resolved = await resolveOwnerTenantId(c);
  if (resolved.response) {
    return resolved.response;
  }

  try {
    const summary = await getStorePerformanceSummary(resolved.tenantId!);
    return c.json(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load store performance summary";
    return c.json({ message }, 500);
  }
});