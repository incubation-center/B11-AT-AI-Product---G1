import Image from 'next/image';

import type { StorefrontProduct, StorefrontStore } from '@/lib/storefront';

export type StorefrontThemeProps = {
  store: StorefrontStore;
  products: StorefrontProduct[];
};

export function getActiveProducts(products: StorefrontProduct[]) {
  return products.filter((product) => product.isActive);
}

export function formatStorePrice(product: StorefrontProduct) {
  if (product.basePriceUsd) {
    return `$${product.basePriceUsd}`;
  }

  if (product.basePriceKhr) {
    return `${product.basePriceKhr} KHR`;
  }

  return 'Ask for price';
}

export function ThemeLogo({
  logoUrl,
  shopName,
  className,
}: {
  logoUrl: string | null;
  shopName: string;
  className?: string;
}) {
  return (
    <div
      className={
        className ??
        'relative h-12 w-12 overflow-hidden rounded-full border border-white/40 bg-white/80'
      }
    >
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={`${shopName} logo`}
          fill
          sizes="64px"
          className="object-contain p-1"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-lg font-semibold text-slate-600">
          {shopName.slice(0, 1).toUpperCase()}
        </div>
      )}
    </div>
  );
}

export function ProductImage({
  src,
  alt,
  sizes,
  className,
}: {
  src: string | null | undefined;
  alt: string;
  sizes: string;
  className: string;
}) {
  if (!src) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-100 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
        No image
      </div>
    );
  }

  return <Image src={src} alt={alt} fill sizes={sizes} className={className} />;
}
