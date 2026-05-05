import { BillingStatusCard } from '@/components/billing/billing-status-card';
import { DashboardSidebarLayout } from '@/components/dashboard/dashboard-sidebar-layout';
import { requireDashboardReady } from '@/lib/auth-server';
import { getTranslations } from 'next-intl/server';

export default async function BillingPage() {
  const state = await requireDashboardReady();
  const t = await getTranslations('billing');

  return (
    <DashboardSidebarLayout>
      <div className="flex min-w-0 flex-col gap-6 py-4 md:gap-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-[#002e6b] md:text-3xl">
              {t('title')}
            </h1>
            <p className="text-default-500 mt-1">
              {t('description')}
            </p>
          </div>
          <div className="w-fit rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900">
            {t('abaPaywayEnabled')}
          </div>
        </div>

        <BillingStatusCard
          initialSubscription={state.tenantStatus?.subscription ?? null}
        />
      </div>
    </DashboardSidebarLayout>
  );
}
