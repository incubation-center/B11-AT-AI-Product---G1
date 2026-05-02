'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

import {
  ProductImage,
  formatStorePrice,
} from '@/components/storefront/themes/shared';
import type { StorefrontProduct } from '@/lib/storefront';

type ProductQuickViewDialogProps = {
  product: StorefrontProduct | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddToCart?: (product: StorefrontProduct, qty: number) => void;
};

export function ProductQuickViewDialog({
  product,
  isOpen,
  onOpenChange,
  onAddToCart,
}: ProductQuickViewDialogProps) {
  const [qty, setQty] = useState(1);

  if (!isOpen || !product) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-quick-view-title"
      onMouseDown={() => onOpenChange(false)}
    >
      <div
        className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
          aria-label="Close product details"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="border-b border-slate-100 px-5 py-4 pr-14">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Product details
          </p>
          <h3
            id="product-quick-view-title"
            className="text-xl font-semibold text-slate-900"
          >
            {product?.name ?? 'Product'}
          </h3>
        </div>

        <div className="p-5 pb-6">
          {product ? (
            <div className="grid gap-5 md:grid-cols-[0.95fr_1.05fr]">
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                <ProductImage
                  src={product.imageUrls[0] ?? null}
                  alt={product.name}
                  sizes="(max-width: 768px) 100vw, 45vw"
                  className="object-cover"
                />
              </div>

              <div className="space-y-4">
                <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Category
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {product.category ?? 'Uncategorized'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Price
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {formatStorePrice(product)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Stock
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {product.stockQty}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Variants
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {product.hasVariants ? 'Required' : 'None'}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Description
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    {product.description ?? 'No product description available.'}
                  </p>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="h-8 w-8 rounded border border-slate-300 text-sm"
                      onClick={() => setQty((value) => Math.max(1, value - 1))}
                    >
                      -
                    </button>
                    <span className="min-w-8 text-center text-sm font-semibold">
                      {qty}
                    </span>
                    <button
                      type="button"
                      className="h-8 w-8 rounded border border-slate-300 text-sm"
                      onClick={() =>
                        setQty((value) =>
                          Math.min(product.stockQty || 1, value + 1),
                        )
                      }
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={product.stockQty <= 0}
                    className="rounded-xl bg-[#002e6b] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => {
                      if (!onAddToCart) return;
                      onAddToCart(product, qty);
                      onOpenChange(false);
                    }}
                  >
                    Add to cart
                  </button>
                </div>

                {product.hasVariants ? (
                  <p className="text-xs text-amber-700">
                    This product has variants. Variant-level selection is not
                    available yet; the base item will be added to cart.
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
