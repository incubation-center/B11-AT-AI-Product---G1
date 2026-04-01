'use client';

import { useState } from 'react';

import { StorefrontCartCheckout } from '@/components/storefront/themes/storefront-cart-checkout';
import { ProductImage, ThemeLogo, formatStorePrice } from '@/components/storefront/themes/shared';
import { ProductQuickViewDialog } from '@/components/storefront/themes/product-quick-view-dialog';
import { useStorefrontCart } from '@/components/storefront/themes/use-storefront-cart';
import type { StorefrontThemeProps } from '@/components/storefront/themes/shared';
import type { StorefrontProduct } from '@/lib/storefront';

function ProductCard({
  name,
  category,
  price,
  stock,
  imageUrl,
  onClick,
}: {
  name: string;
  category: string | null;
  price: string;
  stock: number;
  imageUrl: string | null;
  onClick: () => void;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-[#e7e8ea] bg-white transition-transform duration-200 hover:-translate-y-0.5">
      <button type="button" onClick={onClick} className="w-full cursor-pointer text-left">
        <div className="relative aspect-[4/5] overflow-hidden bg-[#f5f6f7]">
          <ProductImage
            src={imageUrl}
            alt={name}
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, (max-width: 1536px) 33vw, 25vw"
            className="object-cover"
          />
        </div>
        <div className="space-y-2 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7a7f87]">
            {category ?? 'Collection'}
          </p>
          <h3 className="line-clamp-1 text-base font-semibold text-[#17191d]">{name}</h3>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[#0f2745]">{price}</p>
            <p className="text-xs text-[#7a7f87]">Stock {stock}</p>
          </div>
        </div>
      </button>
    </article>
  );
}

export function ModernMinimalGridTheme({ store, products }: StorefrontThemeProps) {
  const [selectedProduct, setSelectedProduct] = useState<StorefrontProduct | null>(null);
  const { cartItems, totalItems, addToCart, updateQty, removeItem, clearCart } = useStorefrontCart();

  return (
    <div className="min-h-screen bg-[#fcfcfb] text-[#17191d]">
      <section className="mx-auto grid w-full max-w-[1440px] grid-cols-12 px-4 py-8 md:px-8 lg:px-12">
        <div className="col-span-12 rounded-[28px] border border-[#e8e9eb] bg-white p-6 md:p-8 lg:col-span-10 lg:col-start-2">
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
              <p className="text-base font-semibold text-[#17191d]">{store.shopName}</p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-7">
              <h1 className="text-4xl leading-tight md:text-5xl">Modern Minimal Grid</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#555b63] md:text-base">
                {store.description ??
                  'A premium storefront rhythm built on whitespace, structure, and quick product scanning.'}
              </p>
            </div>
            <div className="col-span-12 lg:col-span-5">
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
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1440px] grid-cols-12 px-4 pb-16 md:px-8 lg:px-12">
        <div className="col-span-12 lg:col-span-10 lg:col-start-2">
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
                name={product.name}
                category={product.category}
                price={formatStorePrice(product)}
                stock={product.stockQty}
                imageUrl={product.imageUrls[0] ?? null}
                onClick={() => setSelectedProduct(product)}
              />
            ))}
          </div>
        </div>
      </section>

      <ProductQuickViewDialog
        product={selectedProduct}
        isOpen={Boolean(selectedProduct)}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setSelectedProduct(null);
          }
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
