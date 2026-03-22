'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
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

const links = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="h-5 w-5 flex-shrink-0 text-slate-700" />,
  },
  {
    label: 'Products',
    href: '/dashboard/products',
    icon: <Package className="h-5 w-5 flex-shrink-0 text-slate-700" />,
  },
  {
    label: 'Orders',
    href: '/dashboard/orders',
    icon: <Send className="h-5 w-5 flex-shrink-0 text-slate-700" />,
  },
  {
    label: 'Telegram',
    href: '/dashboard/telegram',
    icon: <Waypoints className="h-5 w-5 flex-shrink-0 text-slate-700" />,
  },
  {
    label: 'Settings',
    href: '/dashboard/settings',
    icon: <Settings className="h-5 w-5 flex-shrink-0 text-slate-700" />,
  },
];

export function DashboardSidebarLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

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

      <main className="flex h-full min-h-0 flex-1" aria-label="Owner workspace">
        <div className="flex h-full min-h-0 w-full flex-1 flex-col gap-5 overflow-y-auto p-3 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

function Logo() {
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
