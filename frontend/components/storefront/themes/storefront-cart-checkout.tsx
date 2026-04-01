'use client';

import { useMemo, useState } from 'react';
import { Modal, ModalBody, ModalContent, ModalHeader } from '@heroui/react';

import { formatStorePrice } from '@/components/storefront/themes/shared';
import type { StorefrontCartItem } from '@/components/storefront/themes/use-storefront-cart';

type StorefrontCartCheckoutProps = {
  cartItems: StorefrontCartItem[];
  totalItems: number;
  onUpdateQty: (productId: string, qty: number, variantId?: string | null) => void;
  onRemoveItem: (productId: string, variantId?: string | null) => void;
  onClearCart: () => void;
};

type CheckoutResponse = {
  message?: string;
  order?: {
    id: string;
    orderNo?: string;
  };
};

export function StorefrontCartCheckout({
  cartItems,
  totalItems,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
}: StorefrontCartCheckoutProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<CheckoutResponse | null>(null);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [addressText, setAddressText] = useState('');
  const [googleMapUrl, setGoogleMapUrl] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'aba_transfer'>('cod');
  const [currency, setCurrency] = useState<'USD' | 'KHR'>('USD');
  const [notes, setNotes] = useState('');

  const estimatedTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const rawPrice = currency === 'USD' ? item.product.basePriceUsd : item.product.basePriceKhr;
      const parsed = Number(rawPrice ?? 0);
      const unit = Number.isFinite(parsed) ? parsed : 0;
      return sum + unit * item.qty;
    }, 0);
  }, [cartItems, currency]);

  async function submitCheckout() {
    if (!customerName.trim() || !addressText.trim()) {
      setError('Customer name and address are required.');
      return;
    }

    if (!cartItems.length) {
      setError('Your cart is empty.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/storefront/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim() || undefined,
          address_text: addressText.trim(),
          google_map_url: googleMapUrl.trim() || undefined,
          payment_method: paymentMethod,
          currency,
          notes: notes.trim() || undefined,
          items: cartItems.map((item) => ({
            product_id: item.product.id,
            variant_id: item.variantId ?? undefined,
            qty: item.qty,
          })),
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as CheckoutResponse;

      if (!response.ok) {
        setError(payload.message ?? 'Unable to checkout.');
        return;
      }

      setSuccess(payload);
      onClearCart();
    } catch {
      setError('Unable to checkout right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 z-40 rounded-full bg-[#002e6b] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_35px_rgba(0,46,107,0.35)]"
      >
        Cart ({totalItems})
      </button>

      <Modal isOpen={isOpen} onOpenChange={setIsOpen} size="3xl" placement="center" scrollBehavior="inside">
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Storefront Checkout</p>
                <h3 className="text-xl font-semibold text-slate-900">Cart & Buyer Details</h3>
              </ModalHeader>

              <ModalBody className="pb-6">
                <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
                  <section className="space-y-3">
                    <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Cart items</h4>
                    <div className="space-y-2">
                      {cartItems.length ? (
                        cartItems.map((item) => (
                          <article key={`${item.product.id}:${item.variantId ?? 'base'}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{item.product.name}</p>
                                <p className="text-xs text-slate-500">{formatStorePrice(item.product)}</p>
                              </div>
                              <button
                                type="button"
                                className="text-xs font-semibold text-rose-600"
                                onClick={() => onRemoveItem(item.product.id, item.variantId)}
                              >
                                Remove
                              </button>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              <button
                                type="button"
                                className="h-7 w-7 rounded border border-slate-300 text-sm"
                                onClick={() => onUpdateQty(item.product.id, item.qty - 1, item.variantId)}
                              >
                                -
                              </button>
                              <span className="min-w-8 text-center text-sm font-semibold">{item.qty}</span>
                              <button
                                type="button"
                                className="h-7 w-7 rounded border border-slate-300 text-sm"
                                onClick={() => onUpdateQty(item.product.id, item.qty + 1, item.variantId)}
                              >
                                +
                              </button>
                            </div>
                          </article>
                        ))
                      ) : (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                          Cart is empty.
                        </div>
                      )}
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Checkout form</h4>

                    <input
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                      placeholder="Customer name *"
                      value={customerName}
                      onChange={(event) => setCustomerName(event.target.value)}
                    />
                    <input
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                      placeholder="Phone"
                      value={customerPhone}
                      onChange={(event) => setCustomerPhone(event.target.value)}
                    />
                    <textarea
                      className="min-h-24 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                      placeholder="Address *"
                      value={addressText}
                      onChange={(event) => setAddressText(event.target.value)}
                    />
                    <input
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                      placeholder="Google map URL"
                      value={googleMapUrl}
                      onChange={(event) => setGoogleMapUrl(event.target.value)}
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <select
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        value={paymentMethod}
                        onChange={(event) => setPaymentMethod(event.target.value as 'cod' | 'aba_transfer')}
                      >
                        <option value="cod">Cash on Delivery</option>
                        <option value="aba_transfer">ABA Transfer</option>
                      </select>

                      <select
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        value={currency}
                        onChange={(event) => setCurrency(event.target.value as 'USD' | 'KHR')}
                      >
                        <option value="USD">USD</option>
                        <option value="KHR">KHR</option>
                      </select>
                    </div>

                    <textarea
                      className="min-h-20 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                      placeholder="Notes"
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                    />

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                      Estimated total: <span className="font-semibold">{estimatedTotal.toFixed(2)} {currency}</span>
                    </div>

                    {error ? <p className="text-sm text-rose-600">{error}</p> : null}
                    {success?.order ? (
                      <p className="text-sm text-emerald-700">
                        Order placed: {success.order.orderNo ?? success.order.id}
                      </p>
                    ) : null}

                    <button
                      type="button"
                      onClick={submitCheckout}
                      disabled={isSubmitting || !cartItems.length}
                      className="w-full rounded-xl bg-[#002e6b] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSubmitting ? 'Placing order...' : 'Place order'}
                    </button>
                  </section>
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
