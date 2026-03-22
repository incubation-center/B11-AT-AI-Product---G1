'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

import { CTAButton } from '@/components/ui/cta-button';

export function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 overflow-hidden rounded-full bg-white shadow-sm">
            <Image
              src="/logo.svg"
              alt="Coolhat logo"
              width={36}
              height={36}
              className="h-full w-full object-cover"
              priority
            />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold uppercase tracking-[0.18em] text-[#c61c2f]">
              Coolhat
            </span>
            <span className="text-xs text-[#002e6b]">
              Virtual shop assistant for SMEs
            </span>
          </div>
        </div>

        <nav className="hidden items-center gap-8 text-sm text-[#002e6b] md:flex">
          <Link href="#why" className="transition-colors hover:text-[#c61c2f]">
            Why Coolhat
          </Link>
          <Link
            href="#how-it-works"
            className="transition-colors hover:text-[#c61c2f]"
          >
            How it works
          </Link>
          <Link
            href="#pricing"
            className="transition-colors hover:text-[#c61c2f]"
          >
            Pricing
          </Link>
          <Link
            href="/chat"
            className="flex items-center gap-1.5 rounded-full bg-[#002e6b]/5 px-3 py-1.5 text-xs font-medium text-[#002e6b] ring-1 ring-[#002e6b]/15 transition hover:bg-[#002e6b]/10"
          >
            <Sparkles size={12} className="text-[#c61c2f]" />
            Ask Coolhat AI
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <CTAButton
            as={Link}
            href="#pricing"
            size="sm"
            tone="secondary"
            variant="bordered"
            className="hidden border-[#002e6b]/30 bg-transparent text-xs font-medium md:inline-flex"
          >
            View plans
          </CTAButton>
          <CTAButton
            as={Link}
            href="/sign-in"
            size="sm"
            className="text-xs shadow-lg shadow-red-200/60"
          >
            Sign in
          </CTAButton>
        </div>
      </div>
    </header>
  );
}
