import type { ReactNode } from "react";
import {
  BadgeDollarSign,
  ClipboardList,
  PackageCheck,
  ScanSearch,
} from "lucide-react";

import {
  ActionCard,
  DashboardPageHeader,
  DashboardSection,
  DashboardStatCard,
} from "@/components/dashboard/dashboard-primitives";

export default async function OrdersPage() {
  return (
    <>
      <DashboardPageHeader
        eyebrow="Order workspace"
        title="Keep every incoming order visible and actionable."
        description="This route is the owner control room for payments, fulfilment, and the next operational decision after checkout."
        aside={
          <div className="grid gap-3 sm:grid-cols-3">
            <DashboardStatCard
              label="Pending review"
              value="Use /orders"
              tone="warning"
              detail="Primary review queue for newly created orders."
            />
            <DashboardStatCard
              label="Fulfilment"
              value="Track status"
              detail="Surface packed, shipped, delivered, or cancelled state clearly."
            />
            <DashboardStatCard
              label="Payments"
              value="Verify paid"
              tone="accent"
              detail="Payment state should be scan-friendly and updateable."
            />
          </div>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <DashboardSection
          eyebrow="Order funnel"
          title="The orders page should feel like a live operations board."
          description="This first redesign pass keeps the current scaffold data but gives it a shape that is ready for live endpoint wiring."
        >
          <div className="grid gap-3 md:grid-cols-2">
            <OrderSignal
              icon={<ScanSearch className="h-4 w-4" />}
              title="Review queue"
              body="Incoming orders should land in a list that makes the next action obvious for the owner."
            />
            <OrderSignal
              icon={<BadgeDollarSign className="h-4 w-4" />}
              title="Payment visibility"
              body="Separate payment state from fulfilment state so owners can resolve issues faster."
            />
            <OrderSignal
              icon={<PackageCheck className="h-4 w-4" />}
              title="Fulfilment flow"
              body="Status changes should read like progress, not raw backend fields."
            />
            <OrderSignal
              icon={<ClipboardList className="h-4 w-4" />}
              title="Recent activity"
              body="The final version should bring the latest orders and updates to the top of the workspace."
            />
          </div>
        </DashboardSection>

        <DashboardSection
          eyebrow="Ready for data"
          title="This route now has a clear visual contract"
          description="When wired to the backend order endpoints, the UI already has dedicated regions for summaries, actionable lists, and owner decisions."
        >
          <div className="space-y-3">
            <ActionCard
              href="/dashboard/products"
              badge="Upstream"
              title="Check products before reviewing orders"
              description="Product quality, stock, and publishing state shape downstream order reliability."
            />
            <ActionCard
              href="/dashboard/settings"
              badge="Store context"
              title="Review publishing settings"
              description="Store metadata and storefront state can be surfaced alongside order operations when needed."
            />
          </div>
        </DashboardSection>
      </div>
    </>
  );
}

function OrderSignal({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <article className="rounded-[22px] border border-[var(--dashboard-border)] bg-white/90 p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--dashboard-accent-soft)] text-[var(--dashboard-accent)]">
          {icon}
        </span>
        <h3 className="text-base font-semibold text-[var(--dashboard-ink)]">{title}</h3>
      </div>
      <p className="mt-3 text-sm leading-6 text-[var(--dashboard-muted)]">{body}</p>
    </article>
  );
}
