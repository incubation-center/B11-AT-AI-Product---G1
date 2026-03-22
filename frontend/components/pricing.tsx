'use client';

import { motion } from 'framer-motion';
import { Gift, Zap, TrendingUp } from 'lucide-react';

import { CreativePricing } from '@/components/ui/creative-pricing';
import type { PricingTier } from '@/components/ui/creative-pricing';

const tiers: PricingTier[] = [
  {
    name: 'Free Trial',
    icon: <Gift className="w-6 h-6" />,
    price: 'Free',
    priceNote: '14 days · No credit card required',
    commission: '0% commission',
    description: 'Try Coolhat with no risk',
    color: 'emerald',
    isFree: true,
    ctaLabel: 'Start Free Trial',
    features: [
      'Up to 50 products',
      'AI Sales Assistant (Fair Usage)',
      'Telegram Business Control',
      'ABA Pay + COD checkout',
      'CoolHat Branding',
      'Standard support',
    ],
  },
  {
    name: 'Starter',
    icon: <Zap className="w-6 h-6" />,
    price: 5,
    commission: '1% commission per order',
    description: 'Designed for growing SMEs',
    color: 'amber',
    popular: true,
    ctaLabel: 'Get Starter',
    features: [
      'Up to 50 products',
      'AI Sales Assistant (Optimized)',
      'Telegram Integration',
      'ABA Pay + COD checkout',
      'Order Management',
      'Basic Analytics',
      '"Powered by CoolHat" branding',
    ],
  },
  {
    name: 'Growth',
    icon: <TrendingUp className="w-6 h-6" />,
    price: 10,
    commission: '1% commission per order',
    priceNote: 'Optional commission cap ~$30/mo',
    description: 'For serious scaling businesses',
    color: 'blue',
    ctaLabel: 'Get Growth',
    features: [
      'Unlimited products',
      'AI Sales Assistant (Higher Priority)',
      'Telegram Integration',
      'ABA Pay + COD checkout',
      'Advanced Analytics',
      'Branding removed',
      'Priority support',
    ],
  },
];

export function Pricing() {
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
        tag="Pricing"
        title="Simple plans for growing SMEs."
        description="Start free for 14 days. No credit card required. Scale as your business grows."
        tiers={tiers}
      />
    </motion.section>
  );
}
