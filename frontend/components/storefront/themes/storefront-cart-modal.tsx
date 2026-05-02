'use client';

import { useEffect, useRef, useState } from 'react';
import { Trash2, X } from 'lucide-react';
import Link from 'next/link';

import { formatStorePrice } from '@/components/storefront/themes/shared';
import type { StorefrontCartItem } from '@/components/storefront/themes/use-storefront-cart';

type StorefrontCartModalProps = {
  cartItems: StorefrontCartItem[];
  totalItems: number;
  onUpdateQty: (
    productId: string,
    qty: number,
    variantId?: string | null,
  ) => void;
  onRemoveItem: (productId: string, variantId?: string | null) => void;
  onClearCart: () => void;
};

export function StorefrontCartModal({
  cartItems,
  totalItems,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
}: StorefrontCartModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const previousTotalItems = useRef(totalItems);

  useEffect(() => {
    if (totalItems > previousTotalItems.current) {
      setIsOpen(true);
    }
    previousTotalItems.current = totalItems;
  }, [totalItems]);

  const estimatedTotalUsd = cartItems.reduce((sum, item) => {
    const parsed = Number(item.product.basePriceUsd ?? 0);
    const unit = Number.isFinite(parsed) ? parsed : 0;
    return sum + unit * item.qty;
  }, 0);

  return (
    <>
      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="storefront-cart-title"
          onMouseDown={() => setIsOpen(false)}
        >
          <div
            className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)]"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
              aria-label="Close cart"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 pr-14">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Your Cart
                </p>
                <h3
                  id="storefront-cart-title"
                  className="text-xl font-semibold text-slate-900"
                >
                  {totalItems} item{totalItems > 1 ? 's' : ''}
                </h3>
              </div>
              {cartItems.length ? (
                <button
                  type="button"
                  onClick={onClearCart}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Clear all
                </button>
              ) : null}
            </div>

            <div className="p-5 pb-6">
              {cartItems.length ? (
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <article
                      key={`${item.product.id}:${item.variantId ?? 'base'}`}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {item.product.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatStorePrice(item.product)}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600"
                          onClick={() =>
                            onRemoveItem(item.product.id, item.variantId)
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Remove
                        </button>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          className="h-8 w-8 rounded border border-slate-300 text-sm"
                          onClick={() =>
                            onUpdateQty(
                              item.product.id,
                              item.qty - 1,
                              item.variantId,
                            )
                          }
                        >
                          -
                        </button>
                        <span className="min-w-8 text-center text-sm font-semibold">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          className="h-8 w-8 rounded border border-slate-300 text-sm"
                          onClick={() =>
                            onUpdateQty(
                              item.product.id,
                              item.qty + 1,
                              item.variantId,
                            )
                          }
                        >
                          +
                        </button>
                      </div>
                    </article>
                  ))}

                  <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
                    Estimated total:{' '}
                    <span className="font-semibold text-[#002e6b]">
                      ${estimatedTotalUsd.toFixed(2)}
                    </span>
                  </div>

                  <div className="grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Continue shopping
                    </button>
                    <Link
                      href="/checkout"
                      onClick={() => setIsOpen(false)}
                      className="inline-flex items-center justify-center rounded-xl bg-[#002e6b] px-4 py-3 text-sm font-semibold text-white hover:bg-[#00265a]"
                    >
                      Proceed to checkout
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  Cart is empty. Add products from this storefront.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
