'use client';

import { useMemo, useState } from 'react';

import { ProductQuickViewDialog } from '@/components/storefront/themes/product-quick-view-dialog';
import { ProductImage, ThemeLogo, formatStorePrice } from '@/components/storefront/themes/shared';
import { StorefrontCartCheckout } from '@/components/storefront/themes/storefront-cart-checkout';
import { StorefrontNavbar } from '@/components/storefront/themes/storefront-navbar';
import { useStorefrontCart } from '@/components/storefront/themes/use-storefront-cart';
import type { StorefrontThemeProps } from '@/components/storefront/themes/shared';
import type { StorefrontProduct } from '@/lib/storefront';

function toSlug(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function ProductTile({
  product,
  onQuickView,
  onAddToCart,
}: {
  product: StorefrontProduct;
  onQuickView: () => void;
  onAddToCart: () => void;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-[#dde2ea] bg-white shadow-[0_10px_26px_rgba(2,25,62,0.08)]">
      <div className="relative aspect-[4/3] bg-[#f1f4f8]">
        <ProductImage
          src={product.imageUrls[0] ?? null}
          alt={product.name}
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
          className="object-cover"
        />
      </div>
      <div className="space-y-2 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#778195]">{product.category ?? 'All Products'}</p>
        <h3 className="line-clamp-1 text-base font-semibold text-[#111827]">{product.name}</h3>
        <p className="text-sm font-semibold text-[#0f2745]">{formatStorePrice(product)}</p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={onQuickView}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Details
          </button>
          <button
            type="button"
            disabled={product.stockQty <= 0}
            onClick={onAddToCart}
            className="rounded-lg bg-[#002e6b] px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add to cart
          </button>
        </div>
      </div>
    </article>
  );
}

export function HeroCategoryTilesTheme({ store, products }: StorefrontThemeProps) {
  const [selectedProduct, setSelectedProduct] = useState<StorefrontProduct | null>(null);
  const { cartItems, totalItems, addToCart, updateQty, removeItem, clearCart } = useStorefrontCart(store.subdomain);

  const categories = useMemo(
    () => Array.from(new Set(products.map((product) => product.category?.trim() || 'All Products'))).slice(0, 8),
    [products],
  );

  const featured = products.slice(0, 12);

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[#0f1724]">
      <StorefrontNavbar store={store} totalItems={totalItems} />

      <section className="mx-auto w-full max-w-[1500px] px-4 py-8 md:px-8 lg:px-12">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="relative overflow-hidden rounded-[30px] border border-[#d9dee6] bg-[#111a2c] p-6 text-white md:p-10">
            <div className="absolute inset-0 opacity-65">
              <ProductImage
                src={store.bannerUrl ?? products[0]?.imageUrls[0]}
                alt={`${store.shopName} hero`}
                sizes="(max-width: 1024px) 100vw, 65vw"
                className="object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(10,15,28,0.9)_10%,rgba(10,15,28,0.48)_58%,rgba(10,15,28,0.2)_100%)]" />

            <div className="relative z-10 flex h-full flex-col justify-between gap-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ThemeLogo
                    logoUrl={store.logoUrl}
                    shopName={store.shopName}
                    className="relative h-11 w-11 overflow-hidden rounded-xl border border-white/35 bg-white/95"
                  />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/75">{store.shopType}</p>
                </div>
                <div className="rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-[#0f2745]">
                  Cart {totalItems}
                </div>
              </div>

              <div className="max-w-2xl">
                <h1 className="text-3xl font-semibold leading-tight md:text-5xl">{store.shopName}</h1>
                <p className="mt-4 text-sm leading-7 text-white/85 md:text-base">
                  {store.description ?? 'Browse by category, discover quickly, and add products in one click.'}
                </p>
                <a href="#products" className="mt-6 inline-flex rounded-full bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#0f1724]">
                  Shop now
                </a>
              </div>
            </div>
          </div>

          <aside className="grid gap-3 rounded-[30px] border border-[#d9dee6] bg-white p-4 md:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-2xl border border-[#e8ebf0] bg-[#f5f7fb] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#687182]">Products</p>
              <p className="mt-2 text-2xl font-semibold text-[#111827]">{products.length}</p>
            </div>
            <div className="rounded-2xl border border-[#e8ebf0] bg-[#f5f7fb] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#687182]">Categories</p>
              <p className="mt-2 text-2xl font-semibold text-[#111827]">{categories.length}</p>
            </div>
            <div className="rounded-2xl border border-[#e8ebf0] bg-[#f5f7fb] p-4 md:col-span-2 lg:col-span-1">
              <p className="text-sm font-semibold text-[#111827]">One tap add-to-cart across all products.</p>
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1500px] px-4 pb-6 md:px-8 lg:px-12">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-2xl font-semibold md:text-3xl">Browse Categories</h2>
          <p className="text-sm text-[#687182]">Jump to your favorite section</p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {categories.map((category) => (
            <a
              key={category}
              href={`#${toSlug(category)}`}
              className="group rounded-2xl border border-[#dde2ea] bg-white p-4 transition-colors hover:border-[#0f2745]"
            >
              <p className="text-xs font-semibold text-[#111827]">{category}</p>
            </a>
          ))}
        </div>
      </section>

      <section id="products" className="mx-auto w-full max-w-[1500px] px-4 pb-14 md:px-8 lg:px-12">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {featured.map((product) => (
            <div key={product.id} id={toSlug(product.category?.trim() || 'All Products')}>
              <ProductTile
                product={product}
                onQuickView={() => setSelectedProduct(product)}
                onAddToCart={() => addToCart(product, 1)}
              />
            </div>
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

      <StorefrontCartCheckout
        cartItems={cartItems}
        totalItems={totalItems}
        onUpdateQty={updateQty}
        onRemoveItem={removeItem}
        onClearCart={clearCart}
      />
    </div>
  );
}
