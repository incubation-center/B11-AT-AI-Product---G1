'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

import { SectionIntro } from '@/components/ui/section-intro';
import { LinkCard } from '@/components/ui/link-card';

export function Features() {
  const t = useTranslations('landing.features');
  const items = [
    {
      title: t('items.ai.title'),
      description: t('items.ai.description'),
      imageUrl: '/chatbot.svg',
      href: '#why',
    },
    {
      title: t('items.telegram.title'),
      description: t('items.telegram.description'),
      imageUrl: '/telegram.svg',
      href: '#why',
    },
    {
      title: t('items.storefront.title'),
      description: t('items.storefront.description'),
      imageUrl: '/shops.svg',
      href: '#why',
    },
  ];

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
          eyebrow={t('eyebrow')}
          title={t('title')}
          description={t('description')}
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
