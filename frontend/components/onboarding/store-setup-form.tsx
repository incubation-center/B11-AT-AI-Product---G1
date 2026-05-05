'use client';

import { useRouter } from 'next/navigation';
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
  useTransition,
} from 'react';
import { motion } from 'framer-motion';
import { Globe, Sparkles, Store } from 'lucide-react';

import { CTAButton } from '@/components/ui/cta-button';
import { API_URL, createTenant } from '@/lib/auth';

const shopTypes = [
  { value: 'beauty_cosmetics', label: 'Beauty & Cosmetics' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'food_beverage', label: 'Food & Beverage' },
  { value: 'electronic', label: 'Electronics' },
  { value: 'services', label: 'Services' },
  { value: 'others', label: 'Others' },
];

type SubdomainPreview = {
  available: boolean;
  generatedSubdomain: string;
  suggestions: string[];
} | null;

export function StoreSetupForm() {
  const router = useRouter();
  const [shopName, setShopName] = useState('');
  const [shopType, setShopType] = useState('beauty_cosmetics');
  const [description, setDescription] = useState('');
  const [addressText, setAddressText] = useState('');
  const [googleMapUrl, setGoogleMapUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [paywayLinkUrl, setPaywayLinkUrl] = useState('');
  const [error, setError] = useState('');
  const [subdomain, setSubdomain] = useState<SubdomainPreview>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const nextShopName = shopName.trim();

    if (!nextShopName) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `${API_URL}/tenants/subdomain-available?shop_name=${encodeURIComponent(
            nextShopName,
          )}`,
          { signal: controller.signal },
        );
        const data = (await response.json()) as SubdomainPreview;
        setSubdomain(data);
      } catch {
        setSubdomain(null);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [shopName]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    startTransition(async () => {
      try {
        await createTenant({
          shop_name: shopName,
          shop_type: shopType,
          description,
          address_text: addressText,
          google_map_url: googleMapUrl,
          logo_url: logoUrl,
          banner_url: bannerUrl,
          payway_link_url: paywayLinkUrl.trim() || undefined,
        });
        router.push('/onboarding/template');
        router.refresh();
      } catch (submitError) {
        setError(
          submitError instanceof Error
            ? submitError.message
            : 'Unable to create store',
        );
      }
    });
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff3da,_#fff_42%,_#edf4ff)] px-4 py-6 text-[#002e6b] sm:py-10">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.92fr_1.08fr]">
        <section className="rounded-[28px] border border-white/70 bg-[linear-gradient(145deg,_#002e6b,_#0a4b93_54%,_#ffbd59)] p-5 text-white shadow-[0_30px_90px_rgba(0,46,107,0.22)] sm:rounded-[34px] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
            Step 1
          </p>
          <h1 className="mt-5 max-w-sm text-3xl font-semibold leading-tight sm:text-4xl">
            Build the store identity before anything else.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-white/82">
            Your backend auto-generates the storefront subdomain from
            <code> shop_name </code>. Create the store first, then we move into
            template selection.
          </p>

          <div className="mt-10 space-y-4">
            <FeatureChip
              icon={<Store className="h-4 w-4" />}
              title="Tenant-first onboarding"
              body="Every owner must have a tenant before products, orders, or settings become available."
            />
            <FeatureChip
              icon={<Globe className="h-4 w-4" />}
              title="Auto subdomain generation"
              body="The backend derives a public store URL from your shop name and checks collisions."
            />
            <FeatureChip
              icon={<Sparkles className="h-4 w-4" />}
              title="Template comes next"
              body="After the tenant exists, the owner selects one of the storefront presentation systems."
            />
          </div>
        </section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[28px] border border-slate-200 bg-white/92 p-5 shadow-[0_28px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:rounded-[34px] sm:p-8"
        >
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c61c2f]">
                Store setup
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[#002e6b] sm:text-3xl">
                Create your tenant
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Shop name">
                <input
                  value={shopName}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    const nextValue = event.target.value;
                    setShopName(nextValue);
                    if (!nextValue.trim()) {
                      setSubdomain(null);
                    }
                  }}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#002e6b]"
                  placeholder="Coolhat Skin Studio"
                  required
                />
              </Field>

              <Field label="Shop type">
                <select
                  value={shopType}
                  onChange={(event) => setShopType(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#002e6b]"
                >
                  {shopTypes.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                Generated subdomain
              </p>
              <p className="mt-2 text-lg font-semibold text-[#002e6b]">
                {subdomain?.generatedSubdomain ?? 'waiting-for-shop-name'}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {subdomain
                  ? subdomain.available
                    ? 'Available. The backend can create this store URL.'
                    : `Already taken. Suggestions: ${subdomain.suggestions.join(', ')}`
                  : 'Type your shop name to preview the storefront URL.'}
              </p>
            </div>

            <Field label="Store description">
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#002e6b]"
                placeholder="Tell buyers what the store sells and what makes it special."
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Address">
                <input
                  value={addressText}
                  onChange={(event) => setAddressText(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#002e6b]"
                  placeholder="Phnom Penh, Cambodia"
                />
              </Field>
              <Field label="Google Map URL">
                <input
                  value={googleMapUrl}
                  onChange={(event) => setGoogleMapUrl(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#002e6b]"
                  placeholder="https://maps.google.com/..."
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Logo URL">
                <input
                  value={logoUrl}
                  onChange={(event) => setLogoUrl(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#002e6b]"
                  placeholder="https://..."
                />
              </Field>
              <Field label="Banner URL">
                <input
                  value={bannerUrl}
                  onChange={(event) => setBannerUrl(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#002e6b]"
                  placeholder="https://..."
                />
              </Field>
            </div>

            <Field label="ABA PayWay link URL">
              <input
                value={paywayLinkUrl}
                onChange={(event) => setPaywayLinkUrl(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#002e6b]"
                placeholder="https://link.payway.com.kh/ABAPAYW..."
              />
            </Field>
            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <CTAButton
              type="submit"
              className="w-full py-6 text-sm"
              isLoading={isPending}
            >
              Create store and continue
            </CTAButton>
          </form>
        </motion.section>
      </div>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}

function FeatureChip({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[26px] border border-white/15 bg-white/10 p-4 backdrop-blur">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/14">
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="mt-1 text-sm leading-6 text-white/75">{body}</p>
        </div>
      </div>
    </div>
  );
}
