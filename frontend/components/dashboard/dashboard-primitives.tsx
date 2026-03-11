"use client";

import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

export function DashboardPageHeader({
  eyebrow,
  title,
  description,
  aside,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  aside?: ReactNode;
}) {
  return (
    <section className="dashboard-hero overflow-hidden rounded-[34px] border border-white/75 px-5 py-6 text-[var(--dashboard-hero-ink)] shadow-[0_28px_90px_rgba(17,24,39,0.12)] md:px-8 md:py-8">
      <div className="dashboard-hero__glow" aria-hidden="true" />
      <div className="relative z-10 flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          {eyebrow ? <p className="dashboard-eyebrow text-white/70">{eyebrow}</p> : null}
          <h1 className="mt-4 max-w-3xl font-[family:var(--font-dashboard-display)] text-4xl leading-[0.95] md:text-6xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80 md:text-base">
              {description}
            </p>
          ) : null}
        </div>
        {aside ? <div className="xl:min-w-[420px]">{aside}</div> : null}
      </div>
    </section>
  );
}

export function DashboardSection({
  eyebrow,
  title,
  description,
  action,
  className,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "dashboard-panel rounded-[28px] p-5 md:p-6",
        className
      )}
    >
      <div className="flex flex-col gap-4 border-b border-[var(--dashboard-border)] pb-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          {eyebrow ? <p className="dashboard-eyebrow">{eyebrow}</p> : null}
          <h2 className="mt-2 font-[family:var(--font-dashboard-display)] text-2xl leading-tight text-[var(--dashboard-ink)] md:text-[2rem]">
            {title}
          </h2>
          {description ? (
            <p className="mt-2 max-w-xl text-sm leading-7 text-[var(--dashboard-muted)] md:text-[15px]">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="pt-5">{children}</div>
    </section>
  );
}

export function DashboardStatCard({
  label,
  value,
  tone = "default",
  detail,
}: {
  label: string;
  value: string;
  tone?: "default" | "accent" | "warning" | "success";
  detail?: string;
}) {
  return (
    <article
      className={cn(
        "rounded-[24px] border px-4 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)]",
        tone === "default" &&
          "border-[var(--dashboard-border)] bg-white/92 text-[var(--dashboard-ink)]",
        tone === "accent" &&
          "border-[#002e6b]/12 bg-[linear-gradient(180deg,rgba(0,46,107,0.06),rgba(255,255,255,0.92))] text-[var(--dashboard-ink)]",
        tone === "warning" &&
          "border-amber-200 bg-[linear-gradient(180deg,rgba(255,248,235,0.95),rgba(255,255,255,0.92))] text-[var(--dashboard-ink)]",
        tone === "success" &&
          "border-emerald-200 bg-[linear-gradient(180deg,rgba(236,253,245,0.95),rgba(255,255,255,0.92))] text-[var(--dashboard-ink)]"
      )}
    >
      <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--dashboard-muted)]">
        {label}
      </p>
      <p className="mt-3 text-xl font-semibold leading-none md:text-2xl">{value}</p>
      {detail ? (
        <p className="mt-3 text-xs leading-5 text-[var(--dashboard-muted)]">{detail}</p>
      ) : null}
    </article>
  );
}

export function ActionCard({
  href,
  title,
  description,
  badge,
}: {
  href: string;
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[24px] border border-[var(--dashboard-border)] bg-white/90 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-[#002e6b]/20 hover:shadow-[0_14px_34px_rgba(0,46,107,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dashboard-accent)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          {badge ? <p className="dashboard-eyebrow">{badge}</p> : null}
          <p className="mt-2 text-base font-semibold text-[var(--dashboard-ink)]">
            {title}
          </p>
        </div>
        <ArrowUpRight className="h-4 w-4 text-[var(--dashboard-muted)] transition group-hover:text-[var(--dashboard-accent)]" />
      </div>
      <p className="mt-3 text-sm leading-6 text-[var(--dashboard-muted)]">
        {description}
      </p>
    </Link>
  );
}

export function StatusBanner({
  label,
  title,
  body,
  tone = "warning",
}: {
  label: string;
  title: string;
  body: string;
  tone?: "warning" | "neutral";
}) {
  return (
    <section
      className={cn(
        "rounded-[24px] border px-5 py-4 shadow-[0_16px_36px_rgba(15,23,42,0.06)]",
        tone === "warning" &&
          "border-amber-200 bg-[linear-gradient(135deg,#fff7d7,#fff3c4_45%,#fffdf5)] text-amber-950",
        tone === "neutral" &&
          "border-[var(--dashboard-border)] bg-white/80 text-[var(--dashboard-ink)]"
      )}
    >
      <p className="text-[11px] uppercase tracking-[0.28em] opacity-70">{label}</p>
      <p className="mt-2 text-base font-semibold">{title}</p>
      <p className="mt-1 text-sm leading-6 opacity-80">{body}</p>
    </section>
  );
}
