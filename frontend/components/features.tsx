'use client';

import { motion } from 'framer-motion';

import { SectionIntro } from '@/components/ui/section-intro';
import { LinkCard } from '@/components/ui/link-card';

const items = [
  {
    title: 'AI that knows your products',
    description:
      'Coolhat connects directly to your real catalog, so the assistant can answer questions about ingredients, stock, pricing, and bundles instead of guessing.',
    imageUrl: '/chatbot.svg',
    href: '#why',
  },
  {
    title: 'Built for Telegram first',
    description:
      "SME owners live in Telegram. Coolhat sends orders, updates, and customer chats straight to your phone so you don't need to learn a new dashboard.",
    imageUrl: '/telegram.svg',
    href: '#why',
  },
  {
    title: 'From idea to storefront in days',
    description:
      'Start from a simple description of your shop. Coolhat helps you generate products, copy, and a shoppable storefront without hiring a full dev team.',
    imageUrl: '/shops.svg',
    href: '#why',
  },
];

export function Features() {
  return (
    <motion.section
      id="why"
      className="bg-white py-20 text-[#002e6b] md:py-24"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="mx-auto max-w-6xl px-4">
        <SectionIntro
          eyebrow="Why Coolhat"
          title="One assistant for your customers and your team."
          description="Coolhat combines an AI product expert, storefront builder, and Telegram Mini App into one simple flow, so small shops can sell online with the same experience as bigger brands."
          className="max-w-2xl"
          eyebrowClassName="text-[#c61c2f]"
          descriptionClassName="text-[#002e6b]"
        />

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {items.map((item) => (
            <LinkCard
              key={item.title}
              title={item.title}
              description={item.description}
              imageUrl={item.imageUrl}
              href={item.href}
            />
          ))}
        </div>
      </div>
    </motion.section>
  );
}
