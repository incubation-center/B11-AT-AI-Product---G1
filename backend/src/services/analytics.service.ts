import { and, eq, gte, lt, or, sql } from "drizzle-orm";
import { db } from "../db";
import { chatSessions, orders, products } from "../db/schema";

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

export type OverdueOrdersSummary = {
  totalOverdueAmount: number;
  overdueOrders: number;
};

export type OverdueOrderMockRow = {
  tenantId: string;
  paymentStatus: "unpaid" | "paid" | "refunded";
  orderStatus?: "pending" | "confirmed" | "delivering" | "completed" | "cancelled";
  total: number | string;
  createdAt: Date;
};

export type OverdueOrdersMonthYearResponse = {
  totalOverdueAmount: number;
  overdueOrders: string;
};

export type OverdueOrderMonthYearMockRow = {
  total: number | string;
  status: "unpaid" | "paid" | "pending";
  createdAt: Date;
};

export type BillingSummary = {
  totalRevenue: number;
  paidOrders: number;
  unpaidOrders: number;
};

export type StorePerformanceSummary = {
  totalSessions: number;
  totalOrders: number;
  storePerformancePercent: number;
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

export async function getOverdueOrders(
  tenantId: string,
  daysOverdue = 7
): Promise<OverdueOrdersSummary> {
  try {
    const normalizedDaysOverdue = Number.isFinite(daysOverdue)
      ? Math.max(0, Math.floor(daysOverdue))
      : 7;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - normalizedDaysOverdue);

    const result = await db
      .select({
        totalOverdueAmount: sql<string>`coalesce(sum(${orders.total}), 0)`,
        overdueOrders: sql<number>`count(*)`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.tenantId, tenantId),
          or(eq(orders.paymentStatus, "unpaid"), eq(orders.status, "pending")),
          lt(orders.createdAt, cutoffDate)
        )
      );

    const row = result[0];
    return {
      totalOverdueAmount: row ? Number(row.totalOverdueAmount) || 0 : 0,
      overdueOrders: row?.overdueOrders ?? 0,
    };
  } catch (error) {
    console.error("[analytics] failed to get overdue orders", {
      tenantId,
      daysOverdue,
      error,
    });
    throw new Error("Unable to load overdue orders summary");
  }
}

export async function getOverdueOrdersMock(
  tenantId: string,
  daysOverdue = 7,
  mockRows: OverdueOrderMockRow[] = []
): Promise<OverdueOrdersSummary> {
  const normalizedDaysOverdue = Number.isFinite(daysOverdue)
    ? Math.max(0, Math.floor(daysOverdue))
    : 7;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - normalizedDaysOverdue);

  const filteredRows = mockRows.filter(
    (row) =>
      row.tenantId === tenantId &&
      (row.paymentStatus === "unpaid" || row.orderStatus === "pending") &&
      row.createdAt < cutoffDate
  );

  const totalOverdueAmount = filteredRows.reduce((sum, row) => {
    const value = typeof row.total === "string" ? Number(row.total) : row.total;
    return Number.isFinite(value) ? sum + value : sum;
  }, 0);

  return {
    totalOverdueAmount,
    overdueOrders: filteredRows.length,
  };
}

export async function getOverdueOrdersByMonthYear(
  tenantId: string,
  month?: number,
  year?: number
): Promise<OverdueOrdersMonthYearResponse> {
  try {
    const orderConditions = [
      eq(orders.tenantId, tenantId),
      or(eq(orders.paymentStatus, "unpaid"), eq(orders.status, "pending")),
    ];

    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 1);
      orderConditions.push(gte(orders.createdAt, startDate));
      orderConditions.push(lt(orders.createdAt, endDate));
    }

    const result = await db
      .select({
        totalOverdueAmount: sql<string>`coalesce(sum(${orders.total}), 0)`,
        overdueOrders: sql<number>`count(*)`,
      })
      .from(orders)
      .where(and(...orderConditions));

    const row = result[0];
    const totalAmount = row ? Number(row.totalOverdueAmount) || 0 : 0;
    const orderCount = row?.overdueOrders ?? 0;

    return {
      totalOverdueAmount: totalAmount,
      overdueOrders: String(orderCount),
    };
  } catch (error) {
    console.error("[analytics] failed to get overdue orders by month/year", {
      tenantId,
      month,
      year,
      error,
    });
    throw new Error("Unable to load overdue orders by month/year");
  }
}

export function getOverdueOrdersByMonthYearMock(
  month?: number,
  year?: number,
  mockOrders: OverdueOrderMonthYearMockRow[] = []
): OverdueOrdersMonthYearResponse {
  let filteredOrders = mockOrders.filter(
    (order) => order.status === "unpaid" || order.status === "pending"
  );

  if (month && year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);
    filteredOrders = filteredOrders.filter(
      (order) => order.createdAt >= startDate && order.createdAt < endDate
    );
  }

  const totalOverdueAmount = filteredOrders.reduce((sum, order) => {
    const value = typeof order.total === "string" ? Number(order.total) : order.total;
    return Number.isFinite(value) ? sum + value : sum;
  }, 0);

  return {
    totalOverdueAmount,
    overdueOrders: String(filteredOrders.length),
  };
}

export async function getBillingSummary(tenantId: string): Promise<BillingSummary> {
  try {
    const result = await db
      .select({
        totalRevenue: sql<string>`coalesce(sum(case when ${orders.paymentStatus} = 'paid' then ${orders.total} else 0 end), 0)`,
        paidOrders: sql<number>`coalesce(sum(case when ${orders.paymentStatus} = 'paid' then 1 else 0 end), 0)`,
        unpaidOrders: sql<number>`coalesce(sum(case when ${orders.paymentStatus} = 'unpaid' then 1 else 0 end), 0)`,
      })
      .from(orders)
      .where(eq(orders.tenantId, tenantId));

    const row = result[0];
    return {
      totalRevenue: row ? Number(row.totalRevenue) || 0 : 0,
      paidOrders: row?.paidOrders ?? 0,
      unpaidOrders: row?.unpaidOrders ?? 0,
    };
  } catch (error) {
    console.error("[analytics] failed to get billing summary", { tenantId, error });
    throw new Error("Unable to load billing summary");
  }
}

export async function getStorePerformanceSummary(tenantId: string): Promise<StorePerformanceSummary> {
  try {
    const [sessionResult, orderResult] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(chatSessions)
        .where(eq(chatSessions.tenantId, tenantId)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(eq(orders.tenantId, tenantId)),
    ]);

    const totalSessions = sessionResult[0]?.count ?? 0;
    const totalOrders = orderResult[0]?.count ?? 0;
    const rawPercent = totalSessions > 0 ? (totalOrders / totalSessions) * 100 : 0;
    const storePerformancePercent = Number(rawPercent.toFixed(2));

    return {
      totalSessions,
      totalOrders,
      storePerformancePercent,
    };
  } catch (error) {
    console.error("[analytics] failed to get store performance summary", { tenantId, error });
    throw new Error("Unable to load store performance summary");
  }
}