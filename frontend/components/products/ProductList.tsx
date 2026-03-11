"use client";

import { type Product } from "@/lib/products";

interface ProductListProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

export function ProductList({ products, onEdit, onDelete }: ProductListProps) {
  if (products.length === 0) {
    return (
      <div className="flex-1 rounded-[22px] border border-[var(--dashboard-border)] bg-white/90 p-4">
        <h3 className="mb-4 text-base font-semibold text-[var(--dashboard-ink)]">
          Active Products
        </h3>
        <p className="text-sm text-[var(--dashboard-muted)]">No products found. Create one!</p>
      </div>
    );
  }

  return (
    <div className="flex-1 rounded-[22px] border border-[var(--dashboard-border)] bg-white/90 p-4">
      <h3 className="mb-4 text-base font-semibold text-[var(--dashboard-ink)]">
        Active Products
      </h3>
      <div className="flex flex-col gap-3">
        {products.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between rounded-xl border border-[var(--dashboard-border)] p-3 hover:bg-gray-50/50"
          >
            <div className="flex items-center gap-3">
              {p.image_urls && p.image_urls.length > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.image_urls[0]}
                  alt={p.name}
                  className="h-12 w-12 rounded-lg object-cover border border-[var(--dashboard-border)]"
                />
              ) : (
                <div className="h-12 w-12 rounded-lg bg-gray-100 border border-[var(--dashboard-border)] flex items-center justify-center text-xs text-gray-400">
                  No img
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-medium text-[var(--dashboard-ink)]">{p.name}</span>
                <span className="text-xs text-[var(--dashboard-muted)]">
                  {p.base_price_usd ? `$${p.base_price_usd}` : "No price"} | Stock: {p.stock_qty}
                  {p.is_active ? "" : " (Inactive)"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => onEdit(p)}
                className="text-sm font-medium text-[var(--dashboard-accent)] hover:underline"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(p.id)}
                className="text-sm font-medium text-red-500 hover:underline"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
