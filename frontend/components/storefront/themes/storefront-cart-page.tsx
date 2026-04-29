'use client';

import Link from 'next/link';

import { formatStorePrice } from '@/components/storefront/themes/shared';
import { useStorefrontCart } from '@/components/storefront/themes/use-storefront-cart';
import type { StorefrontStore } from '@/lib/storefront';

type StorefrontCartPageProps = {
  store: StorefrontStore;
};

export function StorefrontCartPage({ store }: StorefrontCartPageProps) {
  const { cartItems, totalItems, updateQty, removeItem } = useStorefrontCart(
    store.subdomain,
  );

  const total = cartItems.reduce((sum, item) => {
    const rawPrice = Number(item.product.basePriceUsd ?? 0);
    return sum + (Number.isFinite(rawPrice) ? rawPrice : 0) * item.qty;
  }, 0);

  return (
    <main className="min-h-screen bg-[#f8fafc] px-4 py-10 text-slate-900 md:px-8">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              {store.shopName}
            </p>
            <h1 className="text-3xl font-semibold">Your Cart</h1>
          </div>
          <Link
            href="/"
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Continue shopping
          </Link>
        </div>

        {!cartItems.length ? (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="text-lg font-semibold text-slate-900">
              Your cart is empty.
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Add products from the storefront first.
            </p>
            <Link
              href="/"
              className="mt-4 inline-flex rounded-xl bg-[#002e6b] px-4 py-2 text-sm font-semibold text-white"
            >
              Back to storefront
            </Link>
          </section>
        ) : (
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 md:p-6">
            {cartItems.map((item) => (
              <article
                key={`${item.product.id}:${item.variantId ?? 'base'}`}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {item.product.name}
                    </p>
                    <p className="text-sm text-slate-600">
                      {formatStorePrice(item.product)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.product.id, item.variantId)}
                    className="text-sm font-semibold text-rose-600"
                  >
                    Remove
                  </button>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      updateQty(item.product.id, item.qty - 1, item.variantId)
                    }
                    className="h-8 w-8 rounded border border-slate-300 text-sm"
                  >
                    -
                  </button>
                  <span className="min-w-8 text-center font-semibold">
                    {item.qty}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updateQty(item.product.id, item.qty + 1, item.variantId)
                    }
                    className="h-8 w-8 rounded border border-slate-300 text-sm"
                  >
                    +
                  </button>
                </div>
              </article>
            ))}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
              <p className="text-sm text-slate-600">
                {totalItems} item{totalItems > 1 ? 's' : ''}
              </p>
              <p className="text-lg font-semibold text-[#002e6b]">
                Estimated ${total.toFixed(2)}
              </p>
            </div>

            <Link
              href="/checkout"
              className="inline-flex w-full items-center justify-center rounded-xl bg-[#002e6b] px-4 py-3 text-sm font-semibold text-white"
            >
              Proceed to checkout
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}
