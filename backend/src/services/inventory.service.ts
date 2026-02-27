import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "../db";
import { orderItems, productVariants, products } from "../db/schema";
import { env } from "../env";

type TxClient = Parameters<Parameters<typeof db.transaction>[0]>[0];
type InventoryChange = "decrease" | "increase";

export type LowStockItem = {
  level: "product" | "variant";
  tenantId: string;
  productId: string;
  productName: string;
  variantId: string | null;
  variantLabel: string | null;
  stockQty: number;
  lowStockThreshold: number;
};

function formatVariantLabel(size: string | null, color: string | null): string | null {
  const parts = [size, color].filter((v): v is string => Boolean(v && v.trim()));
  return parts.length > 0 ? parts.join(" / ") : null;
}

async function sendLowStockTelegramNotification(tenantId: string, items: LowStockItem[]): Promise<void> {
  if (items.length === 0) return;
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return;

  const lines = items.slice(0, 20).map((item) => {
    const label = item.level === "variant" ? `${item.productName} (${item.variantLabel ?? "variant"})` : item.productName;
    return `- ${label}: ${item.stockQty} (threshold ${item.lowStockThreshold})`;
  });

  const text = [`Low stock alert`, `Tenant: ${tenantId}`, ...lines].join("\n");

  try {
    await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text,
      }),
    });
  } catch (error) {
    console.error("[inventory] low-stock telegram notification failed", { tenantId, error });
  }
}

export async function applyOrderInventoryChange(
  tx: TxClient,
  tenantId: string,
  orderId: string,
  change: InventoryChange
): Promise<void> {
  const items = await tx.query.orderItems.findMany({
    where: and(eq(orderItems.tenantId, tenantId), eq(orderItems.orderId, orderId)),
  });

  for (const item of items) {
    const qty = item.qty;
    if (item.variantId) {
      const variant = await tx.query.productVariants.findFirst({
        where: and(eq(productVariants.id, item.variantId), eq(productVariants.tenantId, tenantId)),
      });
      if (!variant) continue;

      const nextStock = change === "decrease" ? variant.stockQty - qty : variant.stockQty + qty;
      if (nextStock < 0) throw new Error("Insufficient variant stock");

      await tx
        .update(productVariants)
        .set({ stockQty: nextStock })
        .where(and(eq(productVariants.id, variant.id), eq(productVariants.tenantId, tenantId)));
      continue;
    }

    const product = await tx.query.products.findFirst({
      where: and(eq(products.id, item.productId), eq(products.tenantId, tenantId)),
    });
    if (!product || !product.trackInventory) continue;

    const nextStock = change === "decrease" ? product.stockQty - qty : product.stockQty + qty;
    if (nextStock < 0) throw new Error("Insufficient product stock");

    await tx
      .update(products)
      .set({ stockQty: nextStock, updatedAt: new Date() })
      .where(and(eq(products.id, product.id), eq(products.tenantId, tenantId)));
  }
}

export async function listLowStockItems(tenantId: string): Promise<LowStockItem[]> {
  const [productRows, variantRows] = await Promise.all([
    db.query.products.findMany({
      where: and(
        eq(products.tenantId, tenantId),
        eq(products.isActive, true),
        eq(products.trackInventory, true),
        sql`${products.stockQty} <= ${products.lowStockThreshold}`
      ),
      columns: {
        id: true,
        tenantId: true,
        name: true,
        stockQty: true,
        lowStockThreshold: true,
      },
    }),
    db.query.productVariants.findMany({
      where: and(
        eq(productVariants.tenantId, tenantId),
        eq(productVariants.isActive, true),
        sql`${productVariants.stockQty} <= ${productVariants.lowStockThreshold}`
      ),
      columns: {
        id: true,
        tenantId: true,
        productId: true,
        size: true,
        color: true,
        stockQty: true,
        lowStockThreshold: true,
      },
    }),
  ]);

  const productMap = new Map<string, string>();
  if (variantRows.length > 0) {
    const ids = Array.from(new Set(variantRows.map((v) => v.productId)));
    const parentProducts = await db.query.products.findMany({
      where: and(eq(products.tenantId, tenantId), inArray(products.id, ids)),
      columns: { id: true, name: true, isActive: true },
    });
    for (const row of parentProducts) {
      if (row.isActive) productMap.set(row.id, row.name);
    }
  }

  const productItems: LowStockItem[] = productRows.map((row) => ({
    level: "product",
    tenantId: row.tenantId,
    productId: row.id,
    productName: row.name,
    variantId: null,
    variantLabel: null,
    stockQty: row.stockQty,
    lowStockThreshold: row.lowStockThreshold,
  }));

  const variantItems: LowStockItem[] = variantRows
    .filter((row) => productMap.has(row.productId))
    .map((row) => ({
      level: "variant",
      tenantId: row.tenantId,
      productId: row.productId,
      productName: productMap.get(row.productId) ?? "Unknown product",
      variantId: row.id,
      variantLabel: formatVariantLabel(row.size, row.color),
      stockQty: row.stockQty,
      lowStockThreshold: row.lowStockThreshold,
    }));

  return [...productItems, ...variantItems];
}

export async function notifyLowStockIfNeeded(tenantId: string): Promise<void> {
  const items = await listLowStockItems(tenantId);
  await sendLowStockTelegramNotification(tenantId, items);
}
