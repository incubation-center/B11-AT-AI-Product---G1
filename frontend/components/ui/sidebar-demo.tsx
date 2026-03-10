"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Bot,
  LayoutDashboard,
  LogOut,
  Package,
  Send,
  Settings,
  Store,
} from "lucide-react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type SidebarDemoProps = {
  userName?: string | null;
  userEmail?: string | null;
  emailVerified?: boolean;
};

const showcaseCards = [
  {
    title: "Telegram command center",
    body: "Run owner workflows, manage orders, and keep the shop live from your phone.",
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Product-aware AI storefront",
    body: "Keep product discovery, chat guidance, and store presentation aligned in one stack.",
    image:
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80",
  },
];

export function SidebarDemo({
  userName,
  userEmail,
  emailVerified,
}: SidebarDemoProps) {
  const [open, setOpen] = useState(false);
  const links = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5 flex-shrink-0 text-slate-700" />,
    },
    {
      label: "Store",
      href: "/telegram?screen=store",
      icon: <Store className="h-5 w-5 flex-shrink-0 text-slate-700" />,
    },
    {
      label: "Products",
      href: "/telegram?screen=products",
      icon: <Package className="h-5 w-5 flex-shrink-0 text-slate-700" />,
    },
    {
      label: "Orders",
      href: "/telegram?screen=orders",
      icon: <Send className="h-5 w-5 flex-shrink-0 text-slate-700" />,
    },
    {
      label: "Settings",
      href: "/telegram?screen=dashboard",
      icon: <Settings className="h-5 w-5 flex-shrink-0 text-slate-700" />,
    },
  ];

  return (
    <div
      className={cn(
        "mx-auto flex h-screen w-full max-w-none flex-col overflow-hidden bg-[linear-gradient(180deg,_#f8fbff,_#eef4ff_48%,_#fff7eb)] md:flex-row"
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="h-screen justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link) => (
                <SidebarLink key={link.label} link={link} />
              ))}
            </div>
          </div>
          <ProfileRail
            open={open}
            userName={userName}
            userEmail={userEmail}
            emailVerified={emailVerified}
          />
        </SidebarBody>
      </Sidebar>
      <DashboardPanel
        userName={userName}
        userEmail={userEmail}
        emailVerified={emailVerified}
      />
    </div>
  );
}

function ProfileRail({
  open,
  userName,
  userEmail,
  emailVerified,
}: {
  open: boolean;
  userName?: string | null;
  userEmail?: string | null;
  emailVerified?: boolean;
}) {
  const label = userName?.trim() || userEmail || "Owner";
  const initial = label.charAt(0).toUpperCase();

  return (
    <div className="space-y-3">
      <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#002e6b] text-sm font-semibold text-white">
            {initial}
          </div>
          {open ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{label}</p>
              <p className="truncate text-xs text-slate-500">
                {emailVerified ? "Verified account" : "Email verification pending"}
              </p>
            </div>
          ) : null}
        </div>
      </div>
      {open ? <SignOutButton /> : <CollapsedLogoutHint />}
    </div>
  );
}

function CollapsedLogoutHint() {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white">
      <LogOut className="h-4 w-4 text-slate-500" />
    </div>
  );
}

export const Logo = () => {
  return (
    <Link
      href="/dashboard"
      className="relative z-20 flex items-center space-x-3 py-1 text-sm font-normal text-black"
    >
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-[#002e6b] text-white shadow-lg shadow-blue-200/70">
        <Bot className="h-5 w-5" />
      </div>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="whitespace-pre text-sm font-semibold text-[#002e6b]"
      >
        Coolhat Owner
      </motion.span>
    </Link>
  );
};

export const LogoIcon = () => {
  return (
    <Link
      href="/dashboard"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black"
    >
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-[#002e6b] text-white shadow-lg shadow-blue-200/70">
        <Bot className="h-5 w-5" />
      </div>
    </Link>
  );
};

function DashboardPanel({
  userName,
  userEmail,
  emailVerified,
}: SidebarDemoProps) {
  return (
    <div className="flex h-full min-h-0 flex-1">
      <div className="flex h-full min-h-0 w-full flex-1 flex-col gap-5 overflow-y-auto p-3 md:p-8">
        <section className="rounded-[30px] border border-white/70 bg-[linear-gradient(135deg,_#002e6b,_#0a4b93_56%,_#ffbd59)] p-6 text-white shadow-[0_28px_80px_rgba(0,46,107,0.22)] md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
                Protected Dashboard
              </p>
              <h1 className="mt-4 text-3xl font-semibold leading-tight md:text-5xl">
                Welcome back{userName ? `, ${userName}` : ""}.
              </h1>
              <p className="mt-4 text-sm leading-7 text-white/84 md:text-base">
                This area sits under <code>app/(protect)</code>, so it only renders
                after login. Use it as the shell for your owner workflows and link
                deeper management routes from the sidebar.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <MetricCard label="Store status" value="Live" />
              <MetricCard label="Email" value={emailVerified ? "Verified" : "Pending"} />
              <MetricCard label="Workspace" value="Owner" />
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.06)] md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c61c2f]">
                  Workspace Overview
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[#002e6b]">
                  Your operator view
                </h2>
              </div>
              <Link
                href="/telegram"
                className="inline-flex items-center justify-center rounded-full border border-[#002e6b]/15 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#002e6b] transition hover:bg-[#002e6b]/5"
              >
                Open mini app
              </Link>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <InfoTile label="Owner email" value={userEmail ?? "No email"} />
              <InfoTile
                label="Access level"
                value="Protected route"
              />
              <InfoTile label="Backend auth" value="Better Auth session" />
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {showcaseCards.map((card) => (
                <article
                  key={card.title}
                  className="overflow-hidden rounded-[26px] border border-slate-200 bg-slate-50"
                >
                  <div
                    className="h-44 w-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${card.image})` }}
                  />
                  <div className="space-y-3 p-5">
                    <h3 className="text-lg font-semibold text-[#002e6b]">
                      {card.title}
                    </h3>
                    <p className="text-sm leading-6 text-slate-600">{card.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c61c2f]">
                Recommended Routes
              </p>
              <div className="mt-5 space-y-3">
                <QuickLink
                  href="/telegram?screen=store"
                  title="Store setup"
                  description="Edit shop profile, banner, and logo."
                />
                <QuickLink
                  href="/telegram?screen=products"
                  title="Product management"
                  description="Create, update, and organize stock-aware items."
                />
                <QuickLink
                  href="/telegram?screen=orders"
                  title="Order operations"
                  description="Review and update Telegram-driven order flow."
                />
              </div>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c61c2f]">
                Current Stack
              </p>
              <div className="mt-5 space-y-3">
                <StatusRow label="TypeScript" value="Enabled" />
                <StatusRow label="Tailwind CSS" value="Configured" />
                <StatusRow label="components/ui" value="Present" />
                <StatusRow label="framer-motion" value="Installed" />
              </div>
            </section>
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/15 bg-white/10 px-4 py-4 backdrop-blur">
      <p className="text-[11px] uppercase tracking-[0.28em] text-white/60">{label}</p>
      <p className="mt-3 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-slate-50 px-4 py-4">
      <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function QuickLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-[#002e6b]/20 hover:bg-white"
    >
      <p className="text-sm font-semibold text-[#002e6b]">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
    </Link>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="text-sm font-semibold text-[#002e6b]">{value}</span>
    </div>
  );
}
