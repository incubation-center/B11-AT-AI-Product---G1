"use client";

import Image from "next/image";
import Link from "next/link";
import { Button, Navbar as HeroNavbar } from "@heroui/react";

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
          <Link
            href="#why"
            className="transition-colors hover:text-[#c61c2f]"
          >
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
        </nav>

        <div className="flex items-center gap-3">
          <Button
            as={Link}
            href="#pricing"
            radius="full"
            size="sm"
            className="hidden border border-[#002e6b]/30 bg-transparent text-xs font-medium uppercase tracking-wide text-[#002e6b] hover:bg-[#002e6b]/5 md:inline-flex"
          >
            View plans
          </Button>
          <Button
            as={Link}
            href="#get-started"
            radius="full"
            size="sm"
            className="bg-[#c61c2f] text-xs font-semibold uppercase tracking-wide text-white shadow-lg shadow-red-200/60 hover:bg-[#a71726]"
          >
            Start free trial
          </Button>
        </div>
      </div>
    </header>
  );
}

