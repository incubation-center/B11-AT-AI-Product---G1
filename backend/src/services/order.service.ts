import { and, desc, eq, gte, ilike, lte } from "drizzle-orm";
import { db } from "../db";
import { orderItems, orders, payments, productVariants, products } from "../db/schema";
import { applyOrderInventoryChange, notifyLowStockIfNeeded } from "./inventory.service";
import { sendTelegramMessageToTenant } from "./telegram-link.service";

type CheckoutItemInput = {
  product_id: string;
  variant_id?: string | null;
  qty: number;
};

type CheckoutInput = {
  customer_name: string;
  customer_phone?: string | null;
  address_text: string;
  google_map_url?: string | null;
  payment_method: "cod" | "aba_transfer";
  currency: "USD" | "KHR";
  notes?: string | null;
  items: CheckoutItemInput[];
};

const TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["delivering", "cancelled"],
  delivering: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

function toMoneyNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function money(value: number): string {
  return value.toFixed(2);
}

function cleanText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function assertQty(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) return value;
  if (typeof value === "string" && /^-?\d+$/.test(value.trim())) {
    const parsed = Number.parseInt(value.trim(), 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }
  return null;
}

function formatOrderPrefix(now: Date): string {
  const y = now.getUTCFullYear();
  const m = `${now.getUTCMonth() + 1}`.padStart(2, "0");
  const d = `${now.getUTCDate()}`.padStart(2, "0");
  return `ORD-${y}${m}${d}-`;
}

async function nextOrderNo(tenantId: string, now: Date): Promise<string> {
  const prefix = formatOrderPrefix(now);
  const existing = await db.query.orders.findMany({
    where: and(eq(orders.tenantId, tenantId), ilike(orders.orderNo, `${prefix}%`)),
    columns: { orderNo: true },
  });

  let maxSerial = 0;
  for (const row of existing) {
    const tail = row.orderNo.slice(prefix.length);
    const serial = Number.parseInt(tail, 10);
    if (Number.isInteger(serial) && serial > maxSerial) maxSerial = serial;
  }

  return `${prefix}${`${maxSerial + 1}`.padStart(4, "0")}`;
}

async function buildCheckoutItemRows(tenantId: string, currency: "USD" | "KHR", items: CheckoutItemInput[]) {
  const rows: Array<{
    productId: string;
    variantId: string | null;
    productNameSnapshot: string;
    variantSnapshot: Record<string, unknown> | null;
    priceSnapshot: string;
    qty: number;
    lineTotal: string;
  }> = [];

  for (const item of items) {
    const qty = assertQty(item.qty);
    if (!qty) {
      throw new Error("Invalid qty in items");
    }

    const product = await db.query.products.findFirst({
      where: and(eq(products.id, item.product_id), eq(products.tenantId, tenantId), eq(products.isActive, true)),
    });
    if (!product) throw new Error("Product not found");

    let variant: typeof productVariants.$inferSelect | null = null;
    if (item.variant_id) {
      variant =
        (await db.query.productVariants.findFirst({
        where: and(
          eq(productVariants.id, item.variant_id),
          eq(productVariants.productId, product.id),
          eq(productVariants.tenantId, tenantId),
          eq(productVariants.isActive, true)
        ),
      })) ?? null;
      if (!variant) throw new Error("Variant not found");
    }

    if (product.hasVariants && !variant) {
      throw new Error("Variant is required for this product");
    }

    const unitPrice = currency === "USD"
      ? toMoneyNumber(variant?.priceUsd ?? product.basePriceUsd)
      : toMoneyNumber(variant?.priceKhr ?? product.basePriceKhr);

    const lineTotal = unitPrice * qty;
    rows.push({
      productId: product.id,
      variantId: variant?.id ?? null,
      productNameSnapshot: product.name,
      variantSnapshot: variant
        ? {
            size: variant.size ?? null,
            color: variant.color ?? null,
            price_usd: variant.priceUsd ?? null,
            price_khr: variant.priceKhr ?? null,
          }
        : null,
      priceSnapshot: money(unitPrice),
      qty,
      lineTotal: money(lineTotal),
    });
  }

  return rows;
}

export async function createCheckoutOrder(tenantId: string, input: CheckoutInput) {
  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw new Error("items is required");
  }

  const itemRows = await buildCheckoutItemRows(tenantId, input.currency, input.items);
  const subtotalNumber = itemRows.reduce((sum, row) => sum + toMoneyNumber(row.lineTotal), 0);
  const subtotal = money(subtotalNumber);
  const total = subtotal;
  const discount = "0.00";

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const now = new Date();
    const orderNo = await nextOrderNo(tenantId, now);

    try {
      const result = await db.transaction(async (tx) => {
        const insertedOrder = await tx
          .insert(orders)
          .values({
            tenantId,
            orderNo,
            customerName: input.customer_name.trim(),
            customerPhone: cleanText(input.customer_phone),
            addressText: input.address_text.trim(),
            googleMapUrl: cleanText(input.google_map_url),
            status: "pending",
            paymentMethod: input.payment_method,
            paymentStatus: "unpaid",
            currency: input.currency,
            subtotal,
            discount,
            total,
            notes: cleanText(input.notes),
          })
          .returning();

        const order = insertedOrder[0];
        await tx.insert(orderItems).values(
          itemRows.map((row) => ({
            tenantId,
            orderId: order.id,
            productId: row.productId,
            variantId: row.variantId,
            productNameSnapshot: row.productNameSnapshot,
            variantSnapshot: row.variantSnapshot,
            priceSnapshot: row.priceSnapshot,
            qty: row.qty,
            lineTotal: row.lineTotal,
          }))
        );

        await tx.insert(payments).values({
          tenantId,
          orderId: order.id,
          method: input.payment_method,
          amount: total,
          reference: null,
          status: "pending",
          paidAt: null,
        });

        return order;
      });

      void sendTelegramMessageToTenant(
        tenantId,
        [
          "New order received",
          `Order: ${result.orderNo}`,
          `Customer: ${input.customer_name.trim()}`,
          `Total: ${total} ${input.currency}`,
          `Payment: ${input.payment_method}`,
        ].join("\n")
      ).catch((error) => {
        console.error("[telegram] order notification failed", { tenantId, error });
      });

      return result;
    } catch (error: any) {
      if (error?.code === "23505") continue;
      throw error;
    }
  }

  throw new Error("Unable to generate unique order number");
}

export async function listOwnerOrders(
  tenantId: string,
  filters: { status?: string | null; from?: string | null; to?: string | null }
) {
  const fromDate = filters.from ? new Date(filters.from) : null;
  const toDate = filters.to ? new Date(filters.to) : null;
  const status = filters.status?.trim() || null;

  return db.query.orders.findMany({
    where: and(
      eq(orders.tenantId, tenantId),
      status ? eq(orders.status, status as any) : undefined,
      fromDate && !Number.isNaN(fromDate.getTime()) ? gte(orders.createdAt, fromDate) : undefined,
      toDate && !Number.isNaN(toDate.getTime()) ? lte(orders.createdAt, toDate) : undefined
    ),
    orderBy: [desc(orders.createdAt)],
  });
}

export async function getOwnerOrderById(tenantId: string, orderId: string) {
  const order = await db.query.orders.findFirst({
    where: and(eq(orders.id, orderId), eq(orders.tenantId, tenantId)),
  });
  if (!order) return null;

  const [items, paymentRows] = await Promise.all([
    db.query.orderItems.findMany({
      where: and(eq(orderItems.orderId, orderId), eq(orderItems.tenantId, tenantId)),
    }),
    db.query.payments.findMany({
      where: and(eq(payments.orderId, orderId), eq(payments.tenantId, tenantId)),
      orderBy: [desc(payments.createdAt)],
    }),
  ]);

  return { ...order, items, payments: paymentRows };
}

export async function updateOwnerOrderStatus(tenantId: string, orderId: string, nextStatus: "pending" | "confirmed" | "delivering" | "completed" | "cancelled") {
  let inventoryTouched = false;
  const updatedOrder = await db.transaction(async (tx) => {
    const order = await tx.query.orders.findFirst({
      where: and(eq(orders.id, orderId), eq(orders.tenantId, tenantId)),
    });
    if (!order) throw new Error("Order not found");

    const allowed = TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(nextStatus)) throw new Error("Invalid order status transition");

    if (order.status !== "confirmed" && nextStatus === "confirmed") {
      await applyOrderInventoryChange(tx, tenantId, order.id, "decrease");
      inventoryTouched = true;
    } else if (order.status === "confirmed" && nextStatus === "cancelled") {
      await applyOrderInventoryChange(tx, tenantId, order.id, "increase");
      inventoryTouched = true;
    }

    const updated = await tx
      .update(orders)
      .set({ status: nextStatus, updatedAt: new Date() })
      .where(and(eq(orders.id, order.id), eq(orders.tenantId, tenantId)))
      .returning();

    return updated[0] ?? null;
  });

  if (inventoryTouched) {
    void notifyLowStockIfNeeded(tenantId).catch((error) => {
      console.error("[inventory] low stock notification failed", { tenantId, error });
    });
  }

  return updatedOrder;
}

export async function updateOwnerOrderPayment(
  tenantId: string,
  orderId: string,
  input: {
    payment_status: "unpaid" | "paid" | "refunded";
    method?: "cod" | "aba_transfer";
    amount?: string | number | null;
    reference?: string | null;
    paid_at?: string | null;
  }
) {
  return db.transaction(async (tx) => {
    const order = await tx.query.orders.findFirst({
      where: and(eq(orders.id, orderId), eq(orders.tenantId, tenantId)),
    });
    if (!order) throw new Error("Order not found");

    const nextMethod = input.method ?? order.paymentMethod;
    const nextStatus = input.payment_status;
    const updatedRows = await tx
      .update(orders)
      .set({
        paymentMethod: nextMethod,
        paymentStatus: nextStatus,
        updatedAt: new Date(),
      })
      .where(and(eq(orders.id, order.id), eq(orders.tenantId, tenantId)))
      .returning();

    if (nextStatus === "paid" || nextStatus === "refunded") {
      await tx.insert(payments).values({
        tenantId,
        orderId: order.id,
        method: nextMethod,
        amount: input.amount != null ? asAmount(input.amount) : order.total,
        reference: cleanText(input.reference),
        status: nextStatus === "paid" ? "confirmed" : "failed",
        paidAt: parsePaidAt(input.paid_at),
      });
    }

    return updatedRows[0] ?? null;
  });
}

function parsePaidAt(value: unknown): Date {
  if (typeof value === "string" && value.trim()) {
    const parsed = new Date(value.trim());
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

function asAmount(value: string | number): string {
  if (typeof value === "number" && Number.isFinite(value)) return money(value);
  const parsed = Number(value);
  if (Number.isFinite(parsed)) return money(parsed);
  return "0.00";
}

export async function cancelOwnerOrder(tenantId: string, orderId: string) {
  return updateOwnerOrderStatus(tenantId, orderId, "cancelled");
}
