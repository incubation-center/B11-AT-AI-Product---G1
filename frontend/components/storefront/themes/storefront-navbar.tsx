'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';

import type { StorefrontStore } from '@/lib/storefront';

type StorefrontNavbarProps = {
  store: StorefrontStore;
  totalItems: number;
};

export function StorefrontNavbar({ store, totalItems }: StorefrontNavbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-[1500px] items-center justify-between px-4 py-3 md:px-8 lg:px-12">
        <Link href="/" className="inline-flex items-center gap-2">
          <span className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
            {store.shopType}
          </span>
          <span className="h-1 w-1 rounded-full bg-slate-300" />
          <span className="text-base font-semibold text-slate-900">{store.shopName}</span>
        </Link>

        <div className="hidden items-center gap-5 md:flex">
          <a href="/" className="text-sm font-semibold text-slate-700 hover:text-slate-900">
            Home
          </a>
          <a href="#products" className="text-sm font-semibold text-slate-700 hover:text-slate-900">
            Products
          </a>
          <a href="/cart" className="text-sm font-semibold text-slate-700 hover:text-slate-900">
            Cart
          </a>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/cart"
            className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            {totalItems}
          </Link>
        </div>
      </nav>
    </header>
  );
}
