'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { useStorefrontCart } from '@/components/storefront/themes/use-storefront-cart';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { StorefrontStore } from '@/lib/storefront';

type CheckoutResponse = {
  message?: string;
  order?: {
    id: string;
    orderNo?: string;
  };
};

type PaywayInitResponse = {
  client_id?: string;
  device_id?: string;
  download_qr?: string;
  expire_in_sec?: string;
  qr_image?: string;
  qr_string?: string;
  request_time?: string;
  token?: string;
  mobile_deep_link?: string;
  message?: string;
};

type PaywayStatusResponse = {
  action?: string;
  data?: {
    action?: string;
    download_receipt?: string;
    message?: {
      message?: string;
      tran_id?: string;
    };
  };
  message?: string;
  status?: {
    message?: string;
    tran_id?: string;
  };
};

type StorefrontCheckoutPageProps = {
  store: StorefrontStore;
};

const failedPaymentActions = new Set([
  'cancelled',
  'canceled',
  'declined',
  'error',
  'expired',
  'failed',
  'rejected',
  'timeout',
]);

function generateDeviceId() {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);

  return Array.from(bytes, (byte) => characters[byte % characters.length]).join(
    '',
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function getPaywayStatusMessage(payload: PaywayStatusResponse) {
  return (
    payload.status?.message ??
    payload.data?.message?.message ??
    payload.message ??
    payload.action ??
    payload.data?.action ??
    ''
  );
}

function isPaywayPaymentSuccess(payload: PaywayStatusResponse) {
  const actionText =
    `${payload.action ?? ''} ${payload.data?.action ?? ''}`.toLowerCase();
  return actionText.split(/\s+/).includes('approved');
}

function isPaywayPaymentFailed(payload: PaywayStatusResponse) {
  const action = (payload.data?.action ?? payload.action)?.trim().toLowerCase();
  return action ? failedPaymentActions.has(action) : false;
}

function getDisplayPaywayStatusMessage(message: string) {
  return message.trim().toLowerCase() === 'success!'
    ? 'Pending payment'
    : message;
}

function getPaywayExpirySeconds(expireInSec?: string) {
  if (!expireInSec) return null;

  const seconds = Number.parseInt(expireInSec, 10);

  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}

function formatPaywayTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function StorefrontCheckoutPage({ store }: StorefrontCheckoutPageProps) {
  const { cartItems, clearCart } = useStorefrontCart(store.subdomain);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<CheckoutResponse | null>(null);
  const [paywayInit, setPaywayInit] = useState<PaywayInitResponse | null>(null);
  const [isPaywayDialogOpen, setIsPaywayDialogOpen] = useState(false);
  const [paywayStatusMessage, setPaywayStatusMessage] = useState('');
  const [paywayExpiresAtMs, setPaywayExpiresAtMs] = useState<number | null>(
    null,
  );
  const [paywayTimerSeconds, setPaywayTimerSeconds] = useState<number | null>(
    null,
  );
  const [submitLabel, setSubmitLabel] = useState('Place order');

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [addressText, setAddressText] = useState('');
  const [googleMapUrl, setGoogleMapUrl] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'aba_transfer'>(
    'cod',
  );
  const [currency, setCurrency] = useState<'USD' | 'KHR'>('USD');
  const [notes, setNotes] = useState('');

  const estimatedTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const rawPrice =
        currency === 'USD'
          ? item.product.basePriceUsd
          : item.product.basePriceKhr;
      const parsed = Number(rawPrice ?? 0);
      const unit = Number.isFinite(parsed) ? parsed : 0;
      return sum + unit * item.qty;
    }, 0);
  }, [cartItems, currency]);

  useEffect(() => {
    if (!isPaywayDialogOpen || !paywayExpiresAtMs) {
      setPaywayTimerSeconds(null);
      return;
    }

    const updateTimer = () => {
      setPaywayTimerSeconds(
        Math.max(0, Math.ceil((paywayExpiresAtMs - Date.now()) / 1000)),
      );
    };

    updateTimer();
    const timerId = window.setInterval(updateTimer, 1000);

    return () => window.clearInterval(timerId);
  }, [isPaywayDialogOpen, paywayExpiresAtMs]);

  async function submitCheckout() {
    if (!customerName.trim() || !customerPhone.trim() || !addressText.trim()) {
      setError('Customer name, phone, and address are required.');
      return;
    }

    if (!cartItems.length) {
      setError('Your cart is empty.');
      return;
    }

    setError('');
    setPaywayInit(null);
    setIsPaywayDialogOpen(false);
    setPaywayStatusMessage('');
    setPaywayExpiresAtMs(null);
    setPaywayTimerSeconds(null);
    setIsSubmitting(true);
    setSubmitLabel(
      paymentMethod === 'aba_transfer'
        ? 'Initializing ABA payment...'
        : 'Placing order...',
    );

    let confirmedPaywayPayment:
      | {
          client_id: string;
          device_id: string;
          request_time: string;
          token: string;
        }
      | undefined;

    try {
      if (paymentMethod === 'aba_transfer') {
        const paywayResponse = await fetch('/api/storefront/payway/init', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ amount: estimatedTotal.toFixed(2) }),
        });

        const paywayPayload = (await paywayResponse
          .json()
          .catch(() => ({}))) as PaywayInitResponse;

        if (!paywayResponse.ok) {
          setError(
            paywayPayload.message ?? 'Unable to initialize ABA payment.',
          );
          return;
        }

        setPaywayInit(paywayPayload);
        setIsPaywayDialogOpen(true);
        const expirySeconds = getPaywayExpirySeconds(
          paywayPayload.expire_in_sec,
        );
        const expiresAtMs = expirySeconds
          ? Date.now() + expirySeconds * 1000
          : null;
        setPaywayExpiresAtMs(expiresAtMs);

        if (
          !paywayPayload.client_id ||
          !paywayPayload.request_time ||
          !paywayPayload.token
        ) {
          setError(
            'ABA payment was initialized, but payment status data was missing. Please try again.',
          );
          setIsPaywayDialogOpen(false);
          setPaywayExpiresAtMs(null);
          setPaywayTimerSeconds(null);
          return;
        }

        setSubmitLabel('Waiting for ABA payment...');
        setPaywayStatusMessage('Scan the QR code or open ABA Mobile to pay.');

        const deviceId = generateDeviceId();
        let paymentSucceeded = false;

        for (
          let attempt = 0;
          expiresAtMs ? Date.now() < expiresAtMs : attempt < 100;
          attempt += 1
        ) {
          const statusResponse = await fetch('/api/storefront/payway/status', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              client_id: paywayPayload.client_id,
              device_id: deviceId,
              request_time: paywayPayload.request_time,
              token: paywayPayload.token,
            }),
          });

          const statusPayload = (await statusResponse
            .json()
            .catch(() => ({}))) as PaywayStatusResponse;

          if (statusResponse.status === 403) {
            setError(
              getPaywayStatusMessage(statusPayload) ||
                'ABA payment status was rejected. Please initialize payment again.',
            );
            setIsPaywayDialogOpen(false);
            setPaywayExpiresAtMs(null);
            setPaywayTimerSeconds(null);
            return;
          }

          if (!statusResponse.ok) {
            setPaywayStatusMessage(
              statusPayload.message ??
                'Waiting for ABA payment confirmation...',
            );
          } else {
            const statusMessage = getPaywayStatusMessage(statusPayload);
            setPaywayStatusMessage(
              statusMessage || 'Waiting for ABA payment confirmation...',
            );

            if (isPaywayPaymentSuccess(statusPayload)) {
              paymentSucceeded = true;
              break;
            }
            if (isPaywayPaymentFailed(statusPayload)) {
              setError(
                getPaywayStatusMessage(statusPayload) ||
                  'ABA payment was not approved. Please try again.',
              );
              setIsPaywayDialogOpen(false);
              setPaywayExpiresAtMs(null);
              setPaywayTimerSeconds(null);
              return;
            }
          }

          if (expiresAtMs) {
            const remainingMs = expiresAtMs - Date.now();
            if (remainingMs <= 0) break;
            await sleep(Math.min(3000, remainingMs));
          } else {
            await sleep(3000);
          }
        }

        if (!paymentSucceeded) {
          setError(
            expiresAtMs
              ? 'ABA payment expired before it was confirmed. Please initialize payment again.'
              : 'ABA payment has not been confirmed yet. The order was not sent to the store owner.',
          );
          setIsPaywayDialogOpen(false);
          setPaywayExpiresAtMs(null);
          setPaywayTimerSeconds(null);
          return;
        }

        setSubmitLabel('Placing order...');
        setPaywayStatusMessage('ABA payment confirmed. Sending order...');
        confirmedPaywayPayment = {
          client_id: paywayPayload.client_id,
          device_id: deviceId,
          request_time: paywayPayload.request_time,
          token: paywayPayload.token,
        };
      }

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
          payway: confirmedPaywayPayment,
          items: cartItems.map((item) => ({
            product_id: item.product.id,
            variant_id: item.variantId ?? undefined,
            qty: item.qty,
          })),
        }),
      });

      const payload = (await response
        .json()
        .catch(() => ({}))) as CheckoutResponse;

      if (!response.ok) {
        setError(payload.message ?? 'Unable to checkout.');
        return;
      }

      setSuccess(payload);
      setIsPaywayDialogOpen(false);
      setPaywayExpiresAtMs(null);
      setPaywayTimerSeconds(null);
      clearCart();
    } catch {
      setError('Unable to checkout right now. Please try again.');
    } finally {
      setIsSubmitting(false);
      setSubmitLabel('Place order');
    }
  }

  if (!cartItems.length && !success?.order) {
    return (
      <main className="min-h-screen bg-[#f8fafc] px-4 py-10 text-slate-900 md:px-8">
        <div className="mx-auto w-full max-w-3xl rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-lg font-semibold text-slate-900">
            No items to checkout.
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Add products to your cart before checkout.
          </p>
          <Link
            href="/cart"
            className="mt-4 inline-flex rounded-xl bg-[#002e6b] px-4 py-2 text-sm font-semibold text-white"
          >
            Go to cart
          </Link>
        </div>
      </main>
    );
  }

  const paywayQrImage = paywayInit?.download_qr ?? paywayInit?.qr_image;

  return (
    <main className="min-h-screen bg-[#f8fafc] px-4 py-10 text-slate-900 md:px-8">
      <div className="mx-auto w-full max-w-3xl space-y-5 rounded-2xl border border-slate-200 bg-white p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              {store.shopName}
            </p>
            <h1 className="text-2xl font-semibold">Checkout</h1>
          </div>
          <Link
            href="/cart"
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back to cart
          </Link>
        </div>

        <input
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
          placeholder="Customer name *"
          value={customerName}
          onChange={(event) => setCustomerName(event.target.value)}
        />
        <input
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
          placeholder="Phone *"
          required
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
            onChange={(event) =>
              setPaymentMethod(event.target.value as 'cod' | 'aba_transfer')
            }
          >
            <option value="cod">Cash on Delivery</option>
            <option value="aba_transfer">ABA Transfer</option>
          </select>

          <select
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            value={currency}
            onChange={(event) =>
              setCurrency(event.target.value as 'USD' | 'KHR')
            }
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
          Estimated total:{' '}
          <span className="font-semibold">
            {estimatedTotal.toFixed(2)} {currency}
          </span>
        </div>

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        {success?.order ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            Order placed: {success.order.orderNo ?? success.order.id}
          </div>
        ) : null}
        <Dialog open={isPaywayDialogOpen} onOpenChange={setIsPaywayDialogOpen}>
          <DialogContent className="max-w-md border-sky-100 bg-white p-0 text-slate-900 shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
            <DialogHeader className="border-b border-slate-100 px-5 py-4 pr-12">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-700">
                ABA Transfer
              </p>
              <DialogTitle className="text-xl font-semibold text-slate-900">
                ABA payment initialized
              </DialogTitle>
            </DialogHeader>
            {paywayInit ? (
              <div className="space-y-4 px-5 pb-5">
                {paywayTimerSeconds !== null ? (
                  <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    <span className="font-medium">Payment timer</span>
                    <span className="font-mono text-base font-semibold tabular-nums">
                      {formatPaywayTimer(paywayTimerSeconds)}
                    </span>
                  </div>
                ) : null}
                {paywayQrImage ? (
                  <div className="flex justify-center rounded-2xl border border-sky-100 bg-sky-50 p-5">
                    <Image
                      src={paywayQrImage}
                      alt="ABA QR"
                      width={288}
                      height={288}
                      className="h-72 w-72 rounded-lg border border-sky-200 bg-white p-2"
                    />
                  </div>
                ) : null}
                {paywayInit.mobile_deep_link ? (
                  <a
                    href={paywayInit.mobile_deep_link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-full justify-center rounded-xl bg-[#002e6b] px-4 py-3 text-sm font-semibold text-white"
                  >
                    Open ABA Mobile App
                  </a>
                ) : null}
                {paywayStatusMessage ? (
                  <p className="rounded-xl border border-sky-100 bg-sky-50 px-3 py-2 text-center text-sm font-medium text-sky-900">
                    {getDisplayPaywayStatusMessage(paywayStatusMessage)}
                  </p>
                ) : null}
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        {success?.order ? (
          <Link
            href="/"
            className="inline-flex w-full justify-center rounded-xl bg-[#002e6b] px-4 py-3 text-sm font-semibold text-white hover:bg-[#00265a]"
          >
            Continue shopping
          </Link>
        ) : (
          <button
            type="button"
            onClick={submitCheckout}
            disabled={isSubmitting || !cartItems.length}
            className="w-full rounded-xl bg-[#002e6b] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? submitLabel : 'Place order'}
          </button>
        )}
      </div>
    </main>
  );
}
