'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Loader2, Smartphone, WalletCards } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  checkBillingPaywayStatus,
  initBillingPayway,
  type PaidSubscriptionPlanId,
  type SubscriptionSummary,
} from '@/lib/auth';

type PaywaySubscriptionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: PaidSubscriptionPlanId;
  onSubscriptionUpdated: (subscription: SubscriptionSummary | null) => void;
};

function getPaymentString(
  payment: Record<string, unknown> | null,
  key:
    | 'download_qr'
    | 'qr_image'
    | 'mobile_deep_link'
    | 'payway_expires_at'
    | 'server_time'
    | 'plan_id'
    | 'client_id'
    | 'device_id'
    | 'request_time'
    | 'token',
) {
  const value = payment?.[key];
  return typeof value === 'string' && value.trim() ? value : null;
}

function getPaymentNumberString(
  payment: Record<string, unknown> | null,
  key: 'expire_in_sec' | 'expireInSec',
) {
  const value = payment?.[key];
  if (typeof value === 'string' && value.trim()) return value;
  if (typeof value === 'number') return String(value);
  return null;
}

function getBackendPaywayExpiresAtMs(payment: Record<string, unknown> | null) {
  const expiresAt = getPaymentString(payment, 'payway_expires_at');
  if (expiresAt) {
    const parsed = Date.parse(expiresAt);
    if (Number.isFinite(parsed)) return parsed;
  }

  const serverTime = getPaymentString(payment, 'server_time');
  const expireInSec =
    getPaymentNumberString(payment, 'expire_in_sec') ??
    getPaymentNumberString(payment, 'expireInSec');
  if (!serverTime || !expireInSec) return null;

  const serverTimeMs = Date.parse(serverTime);
  const seconds = Number.parseInt(expireInSec, 10);
  return Number.isFinite(serverTimeMs) &&
    Number.isFinite(seconds) &&
    seconds > 0
    ? serverTimeMs + seconds * 1000
    : null;
}

function getBillingPaywayStatusPayload(
  payment: Record<string, unknown> | null,
) {
  const planId = getPaymentString(payment, 'plan_id');
  const clientId = getPaymentString(payment, 'client_id');
  const deviceId = getPaymentString(payment, 'device_id');
  const requestTime = getPaymentString(payment, 'request_time');
  const token = getPaymentString(payment, 'token');

  if (
    (planId !== 'starter' && planId !== 'growth') ||
    !clientId ||
    !deviceId ||
    !requestTime ||
    !token
  ) {
    return null;
  }

  return {
    planId,
    clientId,
    deviceId,
    requestTime,
    token,
  };
}

function formatPaywayTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function useCurrentTimeMs(enabled: boolean) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled) return;

    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [enabled]);

  return nowMs;
}

function getStatusMessage(status: unknown, t: (key: string) => string) {
  if (!status || typeof status !== 'object') return t('waitingForPayment');

  const statusRecord = status as Record<string, unknown>;
  const data = statusRecord.data as Record<string, unknown> | undefined;
  const message = statusRecord.message ?? data?.message;

  if (typeof message === 'string') return message;
  if (message && typeof message === 'object') {
    const nested = (message as Record<string, unknown>).message;
    if (typeof nested === 'string') return nested;
  }

  const action = statusRecord.action ?? data?.action;
  if (typeof action === 'string') return `${t('paywayStatus')}: ${action}`;

  return t('waitingForPaywayConfirmation');
}

function getDisplayPaywayStatusMessage(message: string, t: (key: string) => string) {
  return message.trim().toLowerCase() === 'success!'
    ? t('pendingPayment')
    : message;
}

export function PaywaySubscriptionDialog({
  open,
  onOpenChange,
  planId,
  onSubscriptionUpdated,
}: PaywaySubscriptionDialogProps) {
  const t = useTranslations('billing.paywayDialog');
  const tBilling = useTranslations('billing');
  const [subscription, setSubscription] = useState<SubscriptionSummary | null>(
    null,
  );
  const [payment, setPayment] = useState<Record<string, unknown> | null>(null);
  const [paywayStatus, setPaywayStatus] = useState<unknown>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const completedSubscriptionIdRef = useRef<string | null>(null);

  const qrImage = useMemo(
    () =>
      getPaymentString(payment, 'download_qr') ??
      getPaymentString(payment, 'qr_image'),
    [payment],
  );
  const mobileDeepLink = useMemo(
    () => getPaymentString(payment, 'mobile_deep_link'),
    [payment],
  );
  const paywayStatusPayload = useMemo(
    () => getBillingPaywayStatusPayload(payment),
    [payment],
  );
  const paywayExpiresAtMs = useMemo(
    () => getBackendPaywayExpiresAtMs(payment),
    [payment],
  );
  const nowMs = useCurrentTimeMs(
    open && Boolean(paywayExpiresAtMs) && subscription?.status !== 'active',
  );
  const paywayTimerSeconds = useMemo(() => {
    if (!paywayExpiresAtMs || subscription?.status === 'active') return null;
    return Math.max(0, Math.ceil((paywayExpiresAtMs - nowMs) / 1000));
  }, [nowMs, paywayExpiresAtMs, subscription?.status]);
  const hasPaywayExpired =
    paywayTimerSeconds !== null &&
    paywayTimerSeconds <= 0 &&
    subscription?.status !== 'active';

  useEffect(() => {
    if (!open) return;

    let isCancelled = false;

    startTransition(() => {
      setIsInitializing(true);
      setError(null);
      setPayment(null);
      setPaywayStatus(null);
      completedSubscriptionIdRef.current = null;

      initBillingPayway(planId)
        .then((result) => {
          if (isCancelled) return;
          setSubscription(result.subscription);
          setPayment(result.payment);
          if (result.subscription?.status === 'active') {
            completedSubscriptionIdRef.current = result.subscription.id;
            onSubscriptionUpdated(result.subscription);
          }
        })
        .catch((initError) => {
          if (isCancelled) return;
          setError(
            initError instanceof Error
              ? initError.message
              : t('unableInitializePayway'),
          );
        })
        .finally(() => {
          if (!isCancelled) setIsInitializing(false);
        });
    });

    return () => {
      isCancelled = true;
    };
  }, [open, planId, onSubscriptionUpdated, t]);

  useEffect(() => {
    if (
      !open ||
      !paywayStatusPayload ||
      subscription?.status === 'active' ||
      hasPaywayExpired
    ) {
      return;
    }

    let isCancelled = false;
    const poll = async () => {
      try {
        const result = await checkBillingPaywayStatus(paywayStatusPayload);
        if (isCancelled) return;

        setPaywayStatus(result.paywayStatus);
        setSubscription(result.subscription);

        if (
          result.subscription?.status === 'active' &&
          completedSubscriptionIdRef.current !== result.subscription.id
        ) {
          completedSubscriptionIdRef.current = result.subscription.id;
          onSubscriptionUpdated(result.subscription);
        }
      } catch (statusError) {
        if (isCancelled) return;
        setError(
          statusError instanceof Error
            ? statusError.message
            : t('unableCheckPaywayStatus'),
        );
      }
    };

    const intervalId = window.setInterval(poll, 3000);
    poll();

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, [
    open,
    subscription?.status,
    paywayStatusPayload,
    hasPaywayExpired,
    onSubscriptionUpdated,
    t,
  ]);

  const statusText =
    subscription?.status === 'active'
      ? t('paymentConfirmedActive')
      : hasPaywayExpired
        ? t('paymentExpired')
        : getDisplayPaywayStatusMessage(getStatusMessage(paywayStatus, t), t);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-md overflow-hidden border-blue-100 bg-white p-0 text-slate-950 shadow-[0_24px_80px_rgba(0,46,107,0.24)] sm:max-h-[calc(100dvh-2rem)]">
        <DialogHeader className="shrink-0 border-b border-slate-100 bg-gradient-to-r from-[#002e6b] to-[#073f82] px-4 py-4 pr-12 text-white sm:px-5 sm:py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-amber-200 sm:h-11 sm:w-11">
            <WalletCards className="h-5 w-5" />
          </div>
          <DialogTitle className="text-lg font-black sm:text-xl">
            {t('activate')} {planId === 'starter' ? tBilling('starter') : tBilling('growth')}
          </DialogTitle>
          <DialogDescription className="text-sm leading-5 text-blue-50">
            {t('scanQrDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 pb-4 pt-3 sm:space-y-4 sm:px-5 sm:pb-5">
          {isInitializing ? (
            <div className="flex min-h-56 flex-col items-center justify-center gap-3 text-sm font-semibold text-[#002e6b] sm:min-h-72">
              <Loader2 className="h-8 w-8 animate-spin text-[#c61c2f]" />
              {t('initializingPayway')}
            </div>
          ) : null}

          {!isInitializing && paywayTimerSeconds !== null ? (
            <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              <span className="font-bold">{t('paymentTimer')}</span>
              <span className="font-mono text-base font-black tabular-nums">
                {formatPaywayTimer(paywayTimerSeconds)}
              </span>
            </div>
          ) : null}

          {!isInitializing && qrImage ? (
            <div className="rounded-[1.5rem] border border-blue-100 bg-blue-50/60 p-3 sm:p-4">
              <Image
                src={qrImage}
                alt={t('qrCodeAlt')}
                width={288}
                height={288}
                sizes="(max-width: 640px) 78vw, 288px"
                className="mx-auto aspect-square w-full max-w-[min(72vw,18rem)] rounded-2xl border border-blue-100 bg-white object-contain p-2 sm:max-w-72"
              />
            </div>
          ) : null}

          {!isInitializing && mobileDeepLink ? (
            <a
              href={mobileDeepLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#002e6b] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#00265a]"
            >
              <Smartphone className="h-4 w-4" />
              {t('openAbaMobile')}
            </a>
          ) : null}

          {!isInitializing ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-bold text-amber-950">
              {statusText}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
