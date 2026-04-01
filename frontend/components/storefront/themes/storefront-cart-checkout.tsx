'use client';

import { useState } from 'react';
import { Modal, ModalBody, ModalContent, ModalHeader } from '@heroui/react';
import { Trash2 } from 'lucide-react';

import { formatStorePrice } from '@/components/storefront/themes/shared';
import type { StorefrontCartItem } from '@/components/storefront/themes/use-storefront-cart';

type StorefrontCartCheckoutProps = {
  cartItems: StorefrontCartItem[];
  totalItems: number;
  onUpdateQty: (productId: string, qty: number, variantId?: string | null) => void;
  onRemoveItem: (productId: string, variantId?: string | null) => void;
  onClearCart: () => void;
};

export function StorefrontCartCheckout({
  cartItems,
  totalItems,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
}: StorefrontCartCheckoutProps) {
  const [isOpen, setIsOpen] = useState(false);

  const estimatedTotalUsd = cartItems.reduce((sum, item) => {
    const parsed = Number(item.product.basePriceUsd ?? 0);
    const unit = Number.isFinite(parsed) ? parsed : 0;
    return sum + unit * item.qty;
  }, 0);

  return (
    <>
      <Modal isOpen={isOpen} onOpenChange={setIsOpen} size="2xl" placement="center" scrollBehavior="inside">
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Your Cart</p>
                  <h3 className="text-xl font-semibold text-slate-900">{totalItems} item{totalItems > 1 ? 's' : ''}</h3>
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
              </ModalHeader>

              <ModalBody className="pb-6">
                {cartItems.length ? (
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <article
                        key={`${item.product.id}:${item.variantId ?? 'base'}`}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{item.product.name}</p>
                            <p className="text-xs text-slate-500">{formatStorePrice(item.product)}</p>
                          </div>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600"
                            onClick={() => onRemoveItem(item.product.id, item.variantId)}
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Remove
                          </button>
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                          <button
                            type="button"
                            className="h-8 w-8 rounded border border-slate-300 text-sm"
                            onClick={() => onUpdateQty(item.product.id, item.qty - 1, item.variantId)}
                          >
                            -
                          </button>
                          <span className="min-w-8 text-center text-sm font-semibold">{item.qty}</span>
                          <button
                            type="button"
                            className="h-8 w-8 rounded border border-slate-300 text-sm"
                            onClick={() => onUpdateQty(item.product.id, item.qty + 1, item.variantId)}
                          >
                            +
                          </button>
                        </div>
                      </article>
                    ))}

                    <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
                      Estimated total: <span className="font-semibold text-[#002e6b]">${estimatedTotalUsd.toFixed(2)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                    Cart is empty. Add products from this storefront.
                  </div>
                )}
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
