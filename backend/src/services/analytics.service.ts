import { and, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "../db";
import { orders, products } from "../db/schema";

export type AnalyticsSummary = {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  totalProducts: number;
};

export type AnalyticsSummaryFilter = {
  month?: number;
  year?: number;
};

export async function getAnalyticsSummary(
  tenantId: string,
  filter: AnalyticsSummaryFilter = {}
): Promise<AnalyticsSummary> {
  try {
    // Build where conditions for orders query
    const orderConditions = [eq(orders.tenantId, tenantId)];

    if (filter.month && filter.year) {
      const startDate = new Date(filter.year, filter.month - 1, 1);
      const endDate = new Date(filter.year, filter.month, 1);
      orderConditions.push(gte(orders.createdAt, startDate));
      orderConditions.push(lt(orders.createdAt, endDate));
    }

    // Query orders for the tenant with optional date filtering
    const orderResults = await db
      .select({
        total: orders.total,
      })
      .from(orders)
      .where(and(...orderConditions));

    // Calculate revenue and order metrics
    const totalRevenue = orderResults.reduce((sum, order) => {
      const value = typeof order.total === "string" 
        ? parseFloat(order.total) 
        : Number(order.total);
      return sum + (isNaN(value) ? 0 : value);
    }, 0);
    const totalOrders = orderResults.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Query total products for the tenant
    const productResults = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.tenantId, tenantId));

    const totalProducts = productResults[0]?.count || 0;

    return {
      totalRevenue,
      totalOrders,
      avgOrderValue,
      totalProducts,
    };
  } catch (error) {
    console.error("[analytics] failed to build summary", { tenantId, error });
    throw new Error("Unable to load analytics summary");
  }
}