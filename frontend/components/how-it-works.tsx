'use client';

import { motion } from 'framer-motion';
import { BotMessageSquare, Pencil, Send } from 'lucide-react';
import type React from 'react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';

interface StepCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  benefits: string[];
}

const StepCard: React.FC<StepCardProps> = ({
  icon,
  title,
  description,
  benefits,
}) => (
  <div
    className={cn(
      'relative rounded-2xl border border-slate-200 bg-white p-6 text-[#002e6b] transition-all duration-300 ease-in-out',
      'hover:scale-105 hover:shadow-xl hover:shadow-slate-200/80 hover:border-[#ffbd59]/60',
    )}
  >
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#002e6b]/5 text-[#c61c2f]">
      {icon}
    </div>
    <h3 className="mb-2 text-lg font-semibold text-[#002e6b]">{title}</h3>
    <p className="mb-5 text-sm leading-relaxed text-slate-500">{description}</p>
    <ul className="space-y-3">
      {benefits.map((benefit, index) => (
        <li key={index} className="flex items-center gap-3 text-sm">
          <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-[#ffbd59]/20">
            <div className="h-2 w-2 rounded-full bg-[#ffbd59]" />
          </div>
          <span className="text-slate-600">{benefit}</span>
        </li>
      ))}
    </ul>
  </div>
);

export function HowItWorks() {
  const t = useTranslations('landing.how');

  const stepsData = [
    {
      icon: <Pencil className="h-6 w-6" />,
      title: t('steps.one.title'),
      description: t('steps.one.description'),
      benefits: [t('steps.one.b1'), t('steps.one.b2'), t('steps.one.b3')],
    },
    {
      icon: <Send className="h-6 w-6" />,
      title: t('steps.two.title'),
      description: t('steps.two.description'),
      benefits: [t('steps.two.b1'), t('steps.two.b2'), t('steps.two.b3')],
    },
    {
      icon: <BotMessageSquare className="h-6 w-6" />,
      title: t('steps.three.title'),
      description: t('steps.three.description'),
      benefits: [t('steps.three.b1'), t('steps.three.b2'), t('steps.three.b3')],
    },
  ];

  return (
    <motion.section
      id="how-it-works"
      className="bg-white py-16 text-[#002e6b] md:py-20"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="mx-auto max-w-5xl px-4">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-[#ffbd59]">
            {t('eyebrow')}
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-[#002e6b] md:text-4xl">
            {t('title')}
          </h2>
        </div>

        <div className="relative mx-auto mb-8 max-w-4xl">
          <div
            aria-hidden="true"
            className="absolute left-[16.6667%] top-1/2 h-0.5 w-[66.6667%] -translate-y-1/2 bg-slate-200"
          />
          <div className="relative grid grid-cols-3">
            {stepsData.map((_, index) => (
              <div
                key={index}
                className="flex h-8 w-8 items-center justify-center justify-self-center rounded-full bg-[#ffbd59] text-sm font-bold text-white ring-4 ring-white"
              >
                {index + 1}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {stepsData.map((step, index) => (
            <StepCard
              key={index}
              icon={step.icon}
              title={step.title}
              description={step.description}
              benefits={step.benefits}
            />
          ))}
        </div>
      </div>
    </motion.section>
  );
}
