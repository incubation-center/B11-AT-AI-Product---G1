'use client';

import Image from 'next/image';
import { Check, Store } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { StorefrontThemeOption } from '@/lib/storefront-themes';

type StorefrontThemePreviewCardProps = {
  option: StorefrontThemeOption;
  selected?: boolean;
  onSelect?: (themeId: StorefrontThemeOption['id']) => void;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  shopName?: string;
};

function MiniLogo({ logoUrl }: { logoUrl?: string | null }) {
  if (!logoUrl) {
    return <Store className="h-4 w-4 text-slate-500" />;
  }

  return <Image src={logoUrl} alt="Store logo" fill sizes="48px" className="object-contain p-1" />;
}

function MinimalGridMock({ logoUrl, bannerUrl }: { logoUrl?: string | null; bannerUrl?: string | null }) {
  return (
    <div className="h-44 overflow-hidden rounded-2xl border border-[#dfe2e7] bg-[#fbfbfb] p-3">
      <div className="grid h-full grid-cols-12 gap-2">
        <div className="col-span-12 rounded-xl border border-[#e4e7ec] bg-white p-2">
          <div className="flex items-center gap-2">
            <div className="relative h-7 w-7 rounded-lg border border-[#dfe2e7] bg-white">
              <MiniLogo logoUrl={logoUrl} />
            </div>
            <div className="h-2 w-24 rounded-full bg-[#c9ced7]" />
          </div>
        </div>
        <div className="col-span-12 grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="rounded-lg border border-[#e4e7ec] bg-white p-1.5">
              <div className="h-7 rounded-md bg-[#eff2f6]" />
              <div className="mt-1 h-1.5 w-4/5 rounded-full bg-[#cbd1db]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HeroCategoryMock({ logoUrl, bannerUrl }: { logoUrl?: string | null; bannerUrl?: string | null }) {
  return (
    <div className="h-44 overflow-hidden rounded-2xl border border-[#d8deea] bg-[#f6f8fd] p-2.5">
      <div className="grid h-full grid-cols-[1.25fr_0.75fr] gap-2">
        <div className="relative overflow-hidden rounded-xl border border-[#d1d8e7] bg-[#111a2c] p-2">
          {bannerUrl ? <Image src={bannerUrl} alt="Hero preview" fill sizes="220px" className="object-cover opacity-45" /> : null}
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div className="relative h-6 w-6 rounded-md border border-white/35 bg-white">
              <MiniLogo logoUrl={logoUrl} />
            </div>
            <div className="space-y-1">
              <div className="h-2 w-3/4 rounded-full bg-white/85" />
              <div className="h-2 w-2/4 rounded-full bg-white/55" />
            </div>
          </div>
        </div>
        <div className="grid gap-2">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="rounded-lg border border-[#d1d8e7] bg-white" />
          ))}
        </div>
      </div>
    </div>
  );
}

function EditorialLookbookMock({ bannerUrl }: { logoUrl?: string | null; bannerUrl?: string | null }) {
  return (
    <div className="h-44 overflow-hidden rounded-2xl border border-[#d8cebf] bg-[#fbf6ee] p-3">
      <div className="flex h-full flex-col gap-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-[#dccfbf] bg-[#fffdf8] p-2">
            <div className="h-2 w-3/4 rounded-full bg-[#6f5a43]/65" />
            <div className="mt-1 h-2 w-2/4 rounded-full bg-[#6f5a43]/35" />
          </div>
          <div className="relative overflow-hidden rounded-lg border border-[#dccfbf] bg-[#e8dccb]">
            {bannerUrl ? <Image src={bannerUrl} alt="Story preview" fill sizes="160px" className="object-cover" /> : null}
          </div>
        </div>
        <div className="grid flex-1 grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="rounded-lg border border-[#dccfbf] bg-white p-1.5">
              <div className="h-5 rounded bg-[#f2ebe0]" />
              <div className="mt-1 h-1.5 w-4/5 rounded-full bg-[#d8cebf]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function StorefrontThemePreviewCard({
  option,
  selected = false,
  onSelect,
  logoUrl,
  bannerUrl,
  shopName = 'Your Store',
}: StorefrontThemePreviewCardProps) {
  return (
    <article
      className={cn(
        'rounded-[24px] border bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] transition-all',
        selected ? 'border-[#002e6b] ring-2 ring-[#002e6b]/20' : 'border-slate-200 hover:-translate-y-0.5 hover:border-slate-300',
      )}
    >
      {option.id === 'modern-minimal-grid' ? <MinimalGridMock logoUrl={logoUrl} bannerUrl={bannerUrl} /> : null}
      {option.id === 'hero-category-tiles' ? <HeroCategoryMock logoUrl={logoUrl} bannerUrl={bannerUrl} /> : null}
      {option.id === 'editorial-lookbook' ? <EditorialLookbookMock bannerUrl={bannerUrl} /> : null}

      <div className="mt-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#c61c2f]">{shopName}</p>
            <h3 className="text-lg font-semibold text-[#0f2345]">{option.name}</h3>
          </div>
          {selected ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#002e6b] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
              <Check className="h-3.5 w-3.5" />
              Selected
            </span>
          ) : null}
        </div>

        <p className="text-sm leading-6 text-slate-600">{option.summary}</p>

        <ul className="grid gap-1.5 pt-1">
          {option.highlights.map((item) => (
            <li key={item} className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700">
              {item}
            </li>
          ))}
        </ul>

        {onSelect ? (
          <button
            type="button"
            onClick={() => onSelect(option.id)}
            className={cn(
              'mt-2 w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors',
              selected ? 'bg-[#002e6b] text-white' : 'bg-[#ebf1ff] text-[#11336d] hover:bg-[#d9e5ff]',
            )}
          >
            {selected ? 'Active Theme' : `Use ${option.name}`}
          </button>
        ) : null}
      </div>
    </article>
  );
}
