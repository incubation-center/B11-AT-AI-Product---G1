'use client';

import { useState } from 'react';

import { ProductQuickViewDialog } from '@/components/storefront/themes/product-quick-view-dialog';
import {
  ProductImage,
  ThemeLogo,
  formatStorePrice,
} from '@/components/storefront/themes/shared';
import { StorefrontCartCheckout } from '@/components/storefront/themes/storefront-cart-checkout';
import { StorefrontNavbar } from '@/components/storefront/themes/storefront-navbar';
import { useStorefrontCart } from '@/components/storefront/themes/use-storefront-cart';
import type { StorefrontThemeProps } from '@/components/storefront/themes/shared';
import type { StorefrontProduct } from '@/lib/storefront';

function StoryBlock({
  heading,
  body,
  imageUrl,
  reverse,
}: {
  heading: string;
  body: string;
  imageUrl: string | null;
  reverse?: boolean;
}) {
  return (
    <section className="grid items-stretch gap-4 md:grid-cols-2 md:gap-8">
      <div className={reverse ? 'md:order-2' : ''}>
        <div className="h-full rounded-[26px] border border-[#ddd4c8] bg-[#fffcf6] p-6 md:p-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7a6146]">
            Lookbook Story
          </p>
          <h2 className="mt-3 text-3xl leading-tight text-[#231b14] md:text-4xl">
            {heading}
          </h2>
          <p className="mt-4 text-sm leading-7 text-[#5e5348] md:text-base">
            {body}
          </p>
        </div>
      </div>
      <div className={reverse ? 'md:order-1' : ''}>
        <div className="relative h-full min-h-64 overflow-hidden rounded-[26px] border border-[#ddd4c8] bg-[#e7ddcf]">
          <ProductImage
            src={imageUrl}
            alt={heading}
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}

function ProductStrip({
  products,
  onSelect,
  onAddToCart,
}: {
  products: StorefrontProduct[];
  onSelect: (product: StorefrontProduct) => void;
  onAddToCart: (product: StorefrontProduct) => void;
}) {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {products.map((product) => (
        <article
          key={product.id}
          className="overflow-hidden rounded-2xl border border-[#ddd4c8] bg-white"
        >
          <div className="relative aspect-[4/5] bg-[#f0ebe3]">
            <ProductImage
              src={product.imageUrls[0] ?? null}
              alt={product.name}
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover"
            />
          </div>
          <div className="space-y-2 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a7257]">
              {product.category ?? 'Curated'}
            </p>
            <h3 className="line-clamp-1 text-base font-semibold text-[#231b14]">
              {product.name}
            </h3>
            <p className="text-sm font-semibold text-[#3f3125]">
              {formatStorePrice(product)}
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => onSelect(product)}
                className="rounded-lg border border-[#d5cab9] px-3 py-2 text-xs font-semibold text-[#5e5348] hover:bg-[#faf4ea]"
              >
                Details
              </button>
              <button
                type="button"
                disabled={product.stockQty <= 0}
                onClick={() => onAddToCart(product)}
                className="rounded-lg bg-[#3f3125] px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add to cart
              </button>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}

export function EditorialLookbookTheme({
  store,
  products,
}: StorefrontThemeProps) {
  const [selectedProduct, setSelectedProduct] =
    useState<StorefrontProduct | null>(null);
  const { cartItems, totalItems, addToCart, updateQty, removeItem, clearCart } =
    useStorefrontCart(store.subdomain);

  const chunkA = products.slice(0, 3);
  const chunkB = products.slice(3, 6);
  const chunkC = products.slice(6, 9);

  const storySource = products.length ? products : [];

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8f3ea_0%,#fffdf9_42%,#f7f1e7_100%)] text-[#231b14]">
      <StorefrontNavbar store={store} totalItems={totalItems} />

      <section className="mx-auto w-full max-w-[1360px] px-4 py-8 md:px-8 lg:px-12">
        <header className="rounded-[30px] border border-[#ddd4c8] bg-[#fffcf6] p-6 md:p-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ThemeLogo
                logoUrl={store.logoUrl}
                shopName={store.shopName}
                className="relative h-11 w-11 overflow-hidden rounded-full border border-[#d9cfbf] bg-white"
              />
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7a6146]">
                {store.shopType}
              </p>
            </div>
            <div className="rounded-full border border-[#d8ccba] bg-white px-3 py-1 text-xs font-semibold text-[#5e5348]">
              Cart {totalItems}
            </div>
          </div>
          <h1 className="mt-5 text-4xl leading-tight md:text-6xl">
            Editorial / Lookbook
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#5e5348] md:text-base">
            {store.description ??
              'A premium story-driven layout with practical shopping actions in every strip.'}
          </p>
        </header>
      </section>

      <main
        id="products"
        className="mx-auto grid w-full max-w-[1360px] gap-8 px-4 pb-16 md:px-8 lg:px-12"
      >
        <StoryBlock
          heading={storySource[0]?.name ?? 'A New Seasonal Story'}
          body="Present your products as chapters while keeping clear buying actions visible in every section."
          imageUrl={storySource[0]?.imageUrls[0] ?? store.bannerUrl}
        />
        {chunkA.length ? (
          <ProductStrip
            products={chunkA}
            onSelect={setSelectedProduct}
            onAddToCart={(product) => addToCart(product, 1)}
          />
        ) : null}

        <StoryBlock
          heading={storySource[3]?.name ?? 'Craft, Material, and Mood'}
          body="Alternate narratives and product strips so buyers can browse emotionally but still buy instantly."
          imageUrl={
            storySource[3]?.imageUrls[0] ??
            storySource[1]?.imageUrls[0] ??
            store.bannerUrl
          }
          reverse
        />
        {chunkB.length ? (
          <ProductStrip
            products={chunkB}
            onSelect={setSelectedProduct}
            onAddToCart={(product) => addToCart(product, 1)}
          />
        ) : null}

        <StoryBlock
          heading={storySource[6]?.name ?? 'Curated Finishing Picks'}
          body="Keep momentum with one-click add-to-cart throughout the final editorial chapter."
          imageUrl={
            storySource[6]?.imageUrls[0] ??
            storySource[2]?.imageUrls[0] ??
            store.bannerUrl
          }
        />
        {chunkC.length ? (
          <ProductStrip
            products={chunkC}
            onSelect={setSelectedProduct}
            onAddToCart={(product) => addToCart(product, 1)}
          />
        ) : null}
      </main>

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
