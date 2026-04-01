import { useMemo, useState } from 'react';

import type { StorefrontProduct } from '@/lib/storefront';

export type StorefrontCartItem = {
  product: StorefrontProduct;
  qty: number;
  variantId?: string | null;
};

export function useStorefrontCart() {
  const [cartItems, setCartItems] = useState<StorefrontCartItem[]>([]);

  const totalItems = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.qty, 0),
    [cartItems],
  );

  function addToCart(product: StorefrontProduct, qty: number, variantId?: string | null) {
    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.product.id === product.id && (item.variantId ?? null) === (variantId ?? null),
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
          if (item.product.id !== productId || (item.variantId ?? null) !== (variantId ?? null)) {
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
        (item) => item.product.id !== productId || (item.variantId ?? null) !== (variantId ?? null),
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
