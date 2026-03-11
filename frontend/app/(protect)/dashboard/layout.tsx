import type { ReactNode } from "react";

import { DashboardSidebarLayout } from "@/components/dashboard/dashboard-sidebar-layout";
import { requireDashboardReady } from "@/lib/auth-server";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireDashboardReady();

  return <DashboardSidebarLayout>{children}</DashboardSidebarLayout>;
}
