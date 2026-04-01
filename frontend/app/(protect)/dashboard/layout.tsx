import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';

import { DashboardSidebarLayout } from '@/components/dashboard/dashboard-sidebar-layout';
import { getServerTenantStatus } from '@/lib/auth-server';

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Session is already enforced by app/(protect)/layout.tsx.
  // Only gate dashboard readiness here to avoid duplicate session fetches.
  const tenantStatus = await getServerTenantStatus();

  if (!tenantStatus) {
    return <DashboardSidebarLayout>{children}</DashboardSidebarLayout>;
  }

  if (!tenantStatus.hasTenant) {
    redirect('/onboarding/store');
  }

  if (!tenantStatus.tenant?.storefrontTemplate) {
    redirect('/onboarding/template');
  }

  return <DashboardSidebarLayout>{children}</DashboardSidebarLayout>;
}
