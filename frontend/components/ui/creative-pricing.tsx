import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { SubscriptionPlanId } from '@/lib/auth';

// Helper function to detect if text contains Khmer characters
function hasKhmerText(text: string): boolean {
  const khmerRegex = /[\u1780-\u17FF]/g;
  return khmerRegex.test(text);
}

interface PricingTier {
  planId: SubscriptionPlanId;
  name: string;
  icon: React.ReactNode;
  price: number | string;
  priceNote?: string;
  commission?: string;
  description: string;
  features: string[];
  popular?: boolean;
  color: string;
  ctaLabel?: string;
  ctaHref?: string;
  isFree?: boolean;
}

function CreativePricing({
  tag = 'Simple Pricing',
  title = 'Choose Your Plan',
  description = 'Start free, scale as you grow',
  tiers,
}: {
  tag?: string;
  title?: string;
  description?: string;
  tiers: PricingTier[];
}) {
  return (
    <div className="w-full max-w-6xl mx-auto px-4">
      <div className="text-center space-y-4 mb-16">
        <div className="text-sm font-semibold uppercase tracking-widest text-[#c61c2f]">
          {tag}
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-[#002e6b]">
          {title}
        </h2>
        <p className="text-lg text-slate-500 max-w-xl mx-auto">{description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {tiers.map((tier, index) => (
          <div
            key={tier.name}
            className={cn(
              'relative group',
              'transition-all duration-300',
              index === 0 && 'rotate-[-1deg]',
              index === 1 && 'rotate-[1deg]',
              index === 2 && 'rotate-[-1deg]',
            )}
          >
            {/* Card shadow layer */}
            <div
              className={cn(
                'absolute inset-0 bg-white',
                'border-2 border-zinc-900',
                'rounded-lg shadow-[4px_4px_0px_0px] shadow-zinc-900',
                'transition-all duration-300',
                'group-hover:shadow-[8px_8px_0px_0px]',
                'group-hover:translate-x-[-4px]',
                'group-hover:translate-y-[-4px]',
              )}
            />

            <div className="relative p-6">
              {tier.popular && (
                <div
                  className="absolute -top-3 -right-3 bg-amber-400 text-zinc-900
                  font-semibold px-3 py-1 rounded-full rotate-12 text-xs border-2 border-zinc-900 z-10"
                >
                  Most Popular!
                </div>
              )}

              {tier.isFree && (
                <div
                  className="absolute -top-3 -right-3 bg-emerald-400 text-zinc-900
                  font-semibold px-3 py-1 rounded-full -rotate-6 text-xs border-2 border-zinc-900 z-10"
                >
                  No Risk!
                </div>
              )}

              {/* Header */}
              <div className="mb-6">
                <div
                  className={cn(
                    'w-12 h-12 rounded-full mb-4',
                    'flex items-center justify-center',
                    'border-2 border-zinc-900',
                    tier.isFree
                      ? 'text-emerald-600'
                      : tier.popular
                        ? 'text-amber-500'
                        : 'text-[#002e6b]',
                  )}
                >
                  {tier.icon}
                </div>
                <h3 className="text-2xl font-bold text-zinc-900">
                  {tier.name}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {tier.description}
                </p>
              </div>

              {/* Price */}
              <div className="mb-2">
                <div className="flex items-baseline gap-1">
                  {typeof tier.price === 'number' ? (
                    <>
                      <span className="text-4xl font-bold text-zinc-900">
                        ${tier.price}
                      </span>
                      <span className="text-slate-500 text-sm">/month</span>
                    </>
                  ) : (
                    <span className="text-4xl font-bold text-zinc-900">
                      {tier.price}
                    </span>
                  )}
                </div>
                {tier.commission && (
                  <p className="text-sm font-semibold text-[#c61c2f] mt-1">
                    + {tier.commission}
                  </p>
                )}
                {tier.priceNote && (
                  <p className="text-xs text-slate-400 mt-1">
                    {tier.priceNote}
                  </p>
                )}
              </div>

              {/* Divider */}
              <div className="border-t-2 border-dashed border-zinc-200 my-4" />

              {/* Features */}
              <div className="space-y-2 mb-6">
                {tier.features.map((feature) => {
                  const isKhmer = hasKhmerText(feature);
                  return (
                    <div key={feature} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full border-2 border-zinc-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3" />
                      </div>
                      <span
                        className={cn(
                          'text-zinc-800',
                          isKhmer
                            ? 'font-khmer text-base leading-relaxed'
                            : 'text-sm',
                        )}
                      >
                        {feature}
                      </span>
                    </div>
                  );
                })}
              </div>

              <Button
                asChild
                className={cn(
                  'w-full h-11 font-semibold text-sm relative',
                  'border-2 border-zinc-900',
                  'transition-all duration-300',
                  'shadow-[4px_4px_0px_0px] shadow-zinc-900',
                  'hover:shadow-[6px_6px_0px_0px]',
                  'hover:translate-x-[-2px] hover:translate-y-[-2px]',
                  tier.isFree
                    ? ['bg-emerald-400 text-zinc-900 hover:bg-emerald-300']
                    : tier.popular
                      ? ['bg-amber-400 text-zinc-900 hover:bg-amber-300']
                      : ['bg-[#002e6b] text-white hover:bg-[#003d8f]'],
                )}
              >
                <Link href={tier.ctaHref ?? `/billing?plan=${tier.planId}`}>
                  {tier.ctaLabel ?? 'Get Started'}
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { CreativePricing };
export type { PricingTier };
