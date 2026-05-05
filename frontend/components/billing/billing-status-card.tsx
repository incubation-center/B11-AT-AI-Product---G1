'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  BadgeCheck,
  Boxes,
  CalendarClock,
  Loader2,
  Sparkles,
  Zap,
} from 'lucide-react';

import { PaywaySubscriptionDialog } from '@/components/billing/payway-subscription-dialog';
import { Button } from '@/components/ui/button';
import {
  type PaidSubscriptionPlanId,
  type SubscriptionSummary,
  startBillingTrial,
} from '@/lib/auth';
import { cn } from '@/lib/utils';

type BillingStatusCardProps = {
  initialSubscription: SubscriptionSummary | null;
};

function formatDate(value: string | null | undefined, notSetLabel: string) {
  if (!value) return notSetLabel;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return notSetLabel;

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function formatLimit(value: number, unit: string) {
  return `${value.toLocaleString('en-US')} ${unit}`;
}

export function BillingStatusCard({
  initialSubscription,
}: BillingStatusCardProps) {
  const t = useTranslations('billing');
  const [subscription, setSubscription] = useState(initialSubscription);
  const [selectedPlanId, setSelectedPlanId] =
    useState<PaidSubscriptionPlanId>('starter');
  const [isPaywayOpen, setIsPaywayOpen] = useState(false);
  const [isStartingTrial, setIsStartingTrial] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const periodLabel = useMemo(() => {
    if (!subscription) return t('startTrialPrompt');
    if (subscription.status === 'trialing') {
      return t('trialEndsOn', { date: formatDate(subscription.trialEndsAt, t('notSet')) });
    }

    return t('renewsOrExpiresOn', { date: formatDate(subscription.currentPeriodEnd, t('notSet')) });
  }, [subscription, t]);

  const planLabels = useMemo(() => ({
    free_trial: t('freeTrial'),
    starter: t('starter'),
    growth: t('growth'),
  }), [t]);

  const statusLabels = useMemo(() => ({
    trialing: t('trialing'),
    active: t('active'),
    payment_pending: t('paymentPending'),
    past_due: t('pastDue'),
    expired: t('expired'),
    cancelled: t('cancelled'),
  }), [t]);

  const paidPlans: Array<{
    id: PaidSubscriptionPlanId;
    name: string;
    price: string;
    note: string;
  }> = useMemo(() => [
    {
      id: 'starter',
      name: t('starter'),
      price: t('starterPrice'),
      note: t('starterNote'),
    },
    {
      id: 'growth',
      name: t('growth'),
      price: t('growthPrice'),
      note: t('growthNote'),
    },
  ], [t]);

  const capabilityItems = useMemo(() => [
    {
      label: t('productCatalog'),
      value: subscription
        ? formatLimit(subscription.capabilities.productLimit, 'products')
        : t('noActiveLimit'),
      icon: Boxes,
    },
    {
      label: t('aiAssistant'),
      value: subscription
        ? formatLimit(subscription.capabilities.aiMonthlyLimit, 'messages/mo')
        : t('startTrialFirst'),
      icon: Zap,
    },
    {
      label: t('branding'),
      value: subscription?.capabilities.removeBranding
        ? t('brandingRemoved')
        : t('brandingShown'),
      icon: Sparkles,
    },
  ], [subscription, t]);

  async function handleStartTrial() {
    setError(null);
    setIsStartingTrial(true);

    try {
      const result = await startBillingTrial();
      setSubscription(result.subscription);
    } catch (trialError) {
      setError(
        trialError instanceof Error
          ? trialError.message
          : t('unableStartTrial'),
      );
    } finally {
      setIsStartingTrial(false);
    }
  }

  function handleChoosePlan(planId: PaidSubscriptionPlanId) {
    setSelectedPlanId(planId);
    setIsPaywayOpen(true);
  }

  return (
    <>
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-[0_18px_60px_rgba(0,46,107,0.10)]">
          <div className="border-b border-slate-100 bg-gradient-to-r from-[#002e6b] via-[#063b7d] to-[#002e6b] px-5 py-5 text-white md:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-200">
                  {t('currentPlan')}
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight">
                  {subscription ? planLabels[subscription.plan] : t('noPlanYet')}
                </h2>
              </div>
              <span
                className={cn(
                  'inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.16em]',
                  subscription?.isAccessActive
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-900',
                )}
              >
                <BadgeCheck className="h-4 w-4" />
                {subscription
                  ? statusLabels[subscription.status]
                  : t('notStarted')}
              </span>
            </div>

            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-blue-50">
              <CalendarClock className="h-5 w-5 text-amber-200" />
              {periodLabel}
            </div>
          </div>

          <div className="grid gap-4 p-5 md:grid-cols-3 md:p-6">
            {capabilityItems.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4"
              >
                <item.icon className="h-5 w-5 text-[#c61c2f]" />
                <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                  {item.label}
                </p>
                <p className="mt-1 text-sm font-bold text-[#002e6b]">
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {error ? (
            <div className="mx-5 mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 md:mx-6 md:mb-6">
              {error}
            </div>
          ) : null}
        </div>

        <aside className="rounded-[2rem] border border-white/80 bg-white p-5 shadow-[0_18px_60px_rgba(0,46,107,0.10)]">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#c61c2f]">
            {t('upgradeAccess')}
          </p>
          <h3 className="mt-2 text-2xl font-black text-[#002e6b]">
            {t('pickHowGrow')}
          </h3>
          <div className="mt-5 flex flex-col gap-3">
            <Button
              type="button"
              onClick={handleStartTrial}
              disabled={isStartingTrial}
              className="h-11 rounded-2xl bg-[#c61c2f] px-4 font-bold text-white hover:bg-[#a91828]"
            >
              {isStartingTrial ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {t('startFreeTrial')}
            </Button>

            {paidPlans.map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => handleChoosePlan(plan.id)}
                className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#002e6b]/40 hover:shadow-lg"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-base font-black text-[#002e6b]">
                    {t('chooseStarter') === 'Choose Starter' && plan.id === 'starter' 
                      ? t('chooseStarter') 
                      : t('chooseGrowth') === 'Choose Growth' && plan.id === 'growth'
                        ? t('chooseGrowth')
                        : `${t('chooseStarter').split(' ')[0]} ${plan.name}`}
                  </span>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-900">
                    {plan.price}
                  </span>
                </div>
                <p className="mt-2 text-sm font-medium leading-5 text-slate-600">
                  {plan.note}
                </p>
              </button>
            ))}
          </div>
        </aside>
      </section>

      <PaywaySubscriptionDialog
        open={isPaywayOpen}
        onOpenChange={setIsPaywayOpen}
        planId={selectedPlanId}
        onSubscriptionUpdated={setSubscription}
      />
    </>
  );
}
