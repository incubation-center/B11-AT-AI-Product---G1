'use client';

import { motion } from 'framer-motion';
import { Gift, Zap, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { CreativePricing } from '@/components/ui/creative-pricing';
import type { PricingTier } from '@/components/ui/creative-pricing';

export function Pricing() {
  const t = useTranslations('landing.pricing');

  const tiers: PricingTier[] = [
    {
      name: t('freeTrial'),
      icon: <Gift className="w-6 h-6" />,
      price: t('freePrice'),
      priceNote: t('freePriceNote'),
      commission: t('zeroCommission'),
      description: t('riskDesc'),
      color: 'emerald',
      isFree: true,
      ctaLabel: t('startTrialCta'),
      planId: 'free_trial',
      ctaHref: '/sign-up?plan=free_trial',
      features: [
        t('features.free1'),
        t('features.free2'),
        t('features.free3'),
        t('features.free4'),
        t('features.free5'),
        t('features.free6'),
      ],
    },
    {
      name: t('starter'),
      icon: <Zap className="w-6 h-6" />,
      price: 5,
      commission: t('oneCommission'),
      description: t('starterDesc'),
      color: 'amber',
      popular: true,
      ctaLabel: t('getStarterCta'),
      planId: 'starter',
      ctaHref: '/sign-up?plan=starter',
      features: [
        t('features.starter1'),
        t('features.starter2'),
        t('features.starter3'),
        t('features.starter4'),
        t('features.starter5'),
        t('features.starter6'),
        t('features.starter7'),
      ],
    },
    {
      name: t('growth'),
      icon: <TrendingUp className="w-6 h-6" />,
      price: 10,
      commission: t('oneCommission'),
      priceNote: t('growthPriceNote'),
      description: t('growthDesc'),
      color: 'blue',
      ctaLabel: t('getGrowthCta'),
      planId: 'growth',
      ctaHref: '/sign-up?plan=growth',
      features: [
        t('features.growth1'),
        t('features.growth2'),
        t('features.growth3'),
        t('features.growth4'),
        t('features.growth5'),
        t('features.growth6'),
        t('features.growth7'),
      ],
    },
  ];

  return (
    <motion.section
      id="pricing"
      className="bg-white py-20 md:py-24 overflow-hidden"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <CreativePricing
        tag={t('tag')}
        title={t('title')}
        description={t('description')}
        tiers={tiers}
      />
    </motion.section>
  );
}
