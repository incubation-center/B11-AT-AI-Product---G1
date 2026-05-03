'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { motion } from 'framer-motion';

import { StorefrontThemePreviewCard } from '@/components/storefront/theme-preview-card';
import { updateMyTenant } from '@/lib/auth';
import {
  STOREFRONT_THEME_OPTIONS,
  toStorefrontThemeApiValue,
  type StorefrontThemeId,
} from '@/lib/storefront-themes';

export function TemplateSelector() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [, startTransition] = useTransition();

  function handleSelect(templateId: StorefrontThemeId) {
    setError('');
    startTransition(async () => {
      try {
        await updateMyTenant({
          storefront_template: toStorefrontThemeApiValue(templateId),
        });
        router.push('/dashboard');
        router.refresh();
      } catch (submitError) {
        setError(
          submitError instanceof Error
            ? submitError.message
            : 'Unable to save storefront template',
        );
      }
    });
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#e8f1ff,_#fff_42%,_#fff3db)] px-4 py-6 text-[#002e6b] sm:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#c61c2f]">
            Step 2
          </p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
            Choose the storefront language your buyers will feel first.
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            This choice is saved on your store, so it stays attached to the
            account across browser sessions and devices.
          </p>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {STOREFRONT_THEME_OPTIONS.map((template, index) => (
            <motion.article
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="h-full"
            >
              <StorefrontThemePreviewCard
                option={template}
                onSelect={handleSelect}
              />
            </motion.article>
          ))}
        </div>
      </div>
    </main>
  );
}
