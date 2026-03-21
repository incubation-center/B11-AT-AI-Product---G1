
// Page composition — assembles components, no direct state

import { Suspense } from "react";
import DashboardContent from "@/app/(protect)/dashboard/dashboard-content";
import DashboardLoading from "@/app/(protect)/dashboard/loading";

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  );
}
