'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  Bot,
  LayoutDashboard,
  Package,
  Send,
  Settings,
  Waypoints,
} from 'lucide-react';
import { useState } from 'react';

import { SignOutButton } from '@/components/auth/sign-out-button';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

export function DashboardSidebarLayout({ children }: { children: ReactNode }) {
  const t = useTranslations('dashboard.sidebar');
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const links = [
    {
      label: t('dashboard'),
      href: '/dashboard',
      icon: (
        <LayoutDashboard className="h-5 w-5 flex-shrink-0 text-slate-700" />
      ),
    },
    {
      label: t('products'),
      href: '/dashboard/products',
      icon: <Package className="h-5 w-5 flex-shrink-0 text-slate-700" />,
    },
    {
      label: t('orders'),
      href: '/dashboard/orders',
      icon: <Send className="h-5 w-5 flex-shrink-0 text-slate-700" />,
    },
    {
      label: t('inventory'),
      href: '/dashboard/inventory',
      icon: <Waypoints className="h-5 w-5 flex-shrink-0 text-slate-700" />,
    },
    {
      label: t('telegram'),
      href: '/dashboard/telegram',
      icon: <Bot className="h-5 w-5 flex-shrink-0 text-slate-700" />,
    },
    {
      label: t('settings'),
      href: '/dashboard/settings',
      icon: <Settings className="h-5 w-5 flex-shrink-0 text-slate-700" />,
    },
  ];

  return (
    <div className="mx-auto flex h-screen w-full max-w-none flex-col overflow-hidden bg-[radial-gradient(circle_at_top,#fffdf8_0%,#f7f8fc_38%,#eef2f7_100%)] md:flex-row">
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="h-screen justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link) => (
                <SidebarLink
                  key={link.label}
                  link={link}
                  active={pathname === link.href}
                  className={cn(
                    pathname === link.href &&
                      'bg-[#002e6b] text-white hover:bg-[#002e6b]',
                  )}
                />
              ))}
            </div>
          </div>

          {open ? <SignOutButton /> : null}
        </SidebarBody>
      </Sidebar>

      <main
        className="flex h-full min-h-0 flex-1"
        aria-label={t('ownerWorkspace')}
      >
        <div className="flex h-full min-h-0 w-full flex-1 flex-col gap-5 overflow-y-auto p-3 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

function Logo() {
  const t = useTranslations('dashboard.sidebar');
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
        {t('ownerTitle')}
      </motion.span>
    </Link>
  );
}

function LogoIcon() {
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
}
