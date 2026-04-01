import { useEffect, useMemo, useState } from 'react';

import type { StorefrontProduct } from '@/lib/storefront';

export type StorefrontCartItem = {
  product: StorefrontProduct;
  qty: number;
  variantId?: string | null;
};

function getCartStorageKey(storeSubdomain: string) {
  return `coolhat.storefront.cart.${storeSubdomain}`;
}

function sanitizeCartItems(input: unknown): StorefrontCartItem[] {
  if (!Array.isArray(input)) return [];

  const result: StorefrontCartItem[] = [];

  for (const entry of input) {
    if (!entry || typeof entry !== 'object') continue;

    const value = entry as {
      product?: StorefrontProduct;
      qty?: number;
      variantId?: string | null;
    };

    if (!value.product || typeof value.qty !== 'number' || value.qty <= 0) continue;

    result.push({
      product: value.product,
      qty: Math.max(1, Math.floor(value.qty)),
      variantId: value.variantId ?? null,
    });
  }

  return result;
}

export function useStorefrontCart(storeSubdomain: string) {
  const [cartItems, setCartItems] = useState<StorefrontCartItem[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(getCartStorageKey(storeSubdomain));
      const parsed = raw ? JSON.parse(raw) : [];
      setCartItems(sanitizeCartItems(parsed));
    } catch {
      setCartItems([]);
    } finally {
      setIsReady(true);
    }
  }, [storeSubdomain]);

  useEffect(() => {
    if (!isReady || typeof window === 'undefined') return;
    window.localStorage.setItem(getCartStorageKey(storeSubdomain), JSON.stringify(cartItems));
  }, [cartItems, isReady, storeSubdomain]);

  const totalItems = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.qty, 0),
    [cartItems],
  );

  function addToCart(product: StorefrontProduct, qty: number, variantId?: string | null) {
    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.product.id === product.id &&
          (item.variantId ?? null) === (variantId ?? null),
      );

      if (existingIndex === -1) {
        return [...prev, { product, qty, variantId: variantId ?? null }];
      }

      const next = [...prev];
      next[existingIndex] = {
        ...next[existingIndex],
        qty: next[existingIndex].qty + qty,
      };
      return next;
    });
  }

  function updateQty(productId: string, qty: number, variantId?: string | null) {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (
            item.product.id !== productId ||
            (item.variantId ?? null) !== (variantId ?? null)
          ) {
            return item;
          }
          return { ...item, qty };
        })
        .filter((item) => item.qty > 0),
    );
  }

  function removeItem(productId: string, variantId?: string | null) {
    setCartItems((prev) =>
      prev.filter(
        (item) =>
          item.product.id !== productId ||
          (item.variantId ?? null) !== (variantId ?? null),
      ),
    );
  }

  function clearCart() {
    setCartItems([]);
  }

  return {
    cartItems,
    totalItems,
    addToCart,
    updateQty,
    removeItem,
    clearCart,
  };
}
