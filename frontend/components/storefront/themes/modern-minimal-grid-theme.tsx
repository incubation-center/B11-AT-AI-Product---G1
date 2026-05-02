'use client';

import { useMemo, useState } from 'react';

import { StorefrontCartModal } from '@/components/storefront/themes/storefront-cart-modal';
import { StorefrontNavbar } from '@/components/storefront/themes/storefront-navbar';
import {
  ProductImage,
  ThemeLogo,
  formatStorePrice,
} from '@/components/storefront/themes/shared';
import { ProductQuickViewDialog } from '@/components/storefront/themes/product-quick-view-dialog';
import { useStorefrontCart } from '@/components/storefront/themes/use-storefront-cart';
import type { StorefrontThemeProps } from '@/components/storefront/themes/shared';
import type { StorefrontProduct } from '@/lib/storefront';

function ProductCard({
  product,
  onQuickView,
  onAddToCart,
}: {
  product: StorefrontProduct;
  onQuickView: () => void;
  onAddToCart: () => void;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-[#e7e8ea] bg-white shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(15,23,42,0.12)]">
      <div className="relative aspect-[4/5] overflow-hidden bg-[#f5f6f7]">
        <ProductImage
          src={product.imageUrls[0] ?? null}
          alt={product.name}
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, (max-width: 1536px) 33vw, 25vw"
          className="object-cover"
        />
      </div>

      <div className="space-y-3 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7a7f87]">
          {product.category ?? 'Collection'}
        </p>
        <h3 className="line-clamp-1 text-base font-semibold text-[#17191d]">
          {product.name}
        </h3>

        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-[#0f2745]">
            {formatStorePrice(product)}
          </p>
          <p className="text-xs text-[#7a7f87]">Stock {product.stockQty}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onQuickView}
            className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            View details
          </button>
          <button
            type="button"
            disabled={product.stockQty <= 0}
            onClick={onAddToCart}
            className="rounded-xl bg-[#002e6b] px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add to cart
          </button>
        </div>
      </div>
    </article>
  );
}

export function ModernMinimalGridTheme({
  store,
  products,
}: StorefrontThemeProps) {
  const [selectedProduct, setSelectedProduct] =
    useState<StorefrontProduct | null>(null);
  const { cartItems, totalItems, addToCart, updateQty, removeItem, clearCart } =
    useStorefrontCart(store.subdomain);

  const topCategories = useMemo(
    () =>
      Array.from(new Set(products.map((item) => item.category || 'All'))).slice(
        0,
        6,
      ),
    [products],
  );

  return (
    <div className="min-h-screen bg-[#f4f6f9] text-[#17191d]">
      <StorefrontNavbar store={store} totalItems={totalItems} />

      <section className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-8 lg:px-12">
        <div className="rounded-[28px] border border-[#e3e5ea] bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)] md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <ThemeLogo
                logoUrl={store.logoUrl}
                shopName={store.shopName}
                className="relative h-11 w-11 overflow-hidden rounded-xl border border-[#e1e3e8] bg-white"
              />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7a7f87]">
                  {store.shopType}
                </p>
                <p className="text-base font-semibold text-[#17191d]">
                  {store.shopName}
                </p>
              </div>
            </div>

            <div className="rounded-full border border-[#d7deea] bg-[#f6f9ff] px-4 py-2 text-sm font-semibold text-[#0f2745]">
              {totalItems} item{totalItems > 1 ? 's' : ''} in cart
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <h1 className="text-3xl leading-tight md:text-5xl">
                Clean Shopping. Fast Decisions.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#555b63] md:text-base">
                {store.description ??
                  'A refined storefront focused on clear products, confident pricing, and frictionless add-to-cart.'}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {topCategories.map((category) => (
                  <span
                    key={category}
                    className="rounded-full border border-[#d7deea] bg-white px-3 py-1 text-xs font-semibold text-[#41506a]"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative h-52 overflow-hidden rounded-2xl border border-[#e8e9eb] bg-[#f4f5f7] md:h-full">
              <ProductImage
                src={store.bannerUrl ?? products[0]?.imageUrls[0]}
                alt={`${store.shopName} banner`}
                sizes="(max-width: 1024px) 100vw, 35vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section
        id="products"
        className="mx-auto w-full max-w-[1440px] px-4 pb-16 md:px-8 lg:px-12"
      >
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7a7f87]">
              Products
            </p>
            <h2 className="mt-2 text-2xl md:text-3xl">Shop The Collection</h2>
          </div>
          <p className="text-sm text-[#636a73]">{products.length} items</p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onQuickView={() => setSelectedProduct(product)}
              onAddToCart={() => addToCart(product, 1)}
            />
          ))}
        </div>
      </section>

      <ProductQuickViewDialog
        product={selectedProduct}
        isOpen={Boolean(selectedProduct)}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSelectedProduct(null);
        }}
        onAddToCart={addToCart}
      />

      <StorefrontCartModal
        cartItems={cartItems}
        totalItems={totalItems}
        onUpdateQty={updateQty}
        onRemoveItem={removeItem}
        onClearCart={clearCart}
      />
    </div>
  );
}
