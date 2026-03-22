'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { motion } from 'framer-motion';
import { Check, LayoutGrid, Rows3, ShoppingBag } from 'lucide-react';

import { CTAButton } from '@/components/ui/cta-button';
import { updateMyTenant } from '@/lib/auth';

const templates = [
  {
    id: 'boutique-editorial',
    name: 'Boutique Editorial',
    tone: 'Fashion and beauty stores that need polished storytelling.',
    icon: <ShoppingBag className="h-5 w-5" />,
    palette: 'from-[#002e6b] via-[#0a4b93] to-[#ffbd59]',
    preview: [
      'Hero storytelling',
      'Feature-led product rows',
      'Magazine rhythm',
    ],
  },
  {
    id: 'market-grid',
    name: 'Market Grid',
    tone: 'Dense product-first storefronts for fast discovery and conversion.',
    icon: <LayoutGrid className="h-5 w-5" />,
    palette: 'from-[#1f2937] via-[#475569] to-[#94a3b8]',
    preview: ['Category grid', 'Quick product scan', 'Promotion rails'],
  },
  {
    id: 'catalog-flow',
    name: 'Catalog Flow',
    tone: 'Balanced ecommerce layout for services, electronics, and mixed catalogs.',
    icon: <Rows3 className="h-5 w-5" />,
    palette: 'from-[#4c1d95] via-[#7c3aed] to-[#f97316]',
    preview: [
      'Modular sections',
      'Responsive deal panels',
      'Flexible product blocks',
    ],
  },
];

export function TemplateSelector() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSelect(templateId: string) {
    setError('');
    startTransition(async () => {
      try {
        await updateMyTenant({
          storefront_template: templateId,
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#e8f1ff,_#fff_42%,_#fff3db)] px-4 py-10 text-[#002e6b]">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#c61c2f]">
            Step 2
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight">
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
          {templates.map((template, index) => (
            <motion.article
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.08)]"
            >
              <div
                className={`bg-gradient-to-br ${template.palette} p-6 text-white`}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12">
                  {template.icon}
                </div>
                <h2 className="mt-6 text-2xl font-semibold">{template.name}</h2>
                <p className="mt-3 text-sm leading-6 text-white/82">
                  {template.tone}
                </p>
              </div>

              <div className="space-y-5 p-6">
                <div className="grid gap-3">
                  {template.preview.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3"
                    >
                      <Check className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm text-slate-700">{item}</span>
                    </div>
                  ))}
                </div>

                <CTAButton
                  type="button"
                  onPress={() => handleSelect(template.id)}
                  className="w-full text-sm"
                  isLoading={isPending}
                >
                  Use {template.name}
                </CTAButton>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </main>
  );
}
