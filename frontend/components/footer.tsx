'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

export function Footer() {
  const t = useTranslations('landing.footer');

  return (
    <motion.footer
      className="border-t border-slate-200 bg-white py-6 text-[#002e6b]"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-xs sm:flex-row">
        <p className="text-[11px] text-slate-600">
          (c) {new Date().getFullYear()} Coolhat. {t('copyright')}
        </p>
        <div className="flex items-center gap-4">
          <Link href="#why" className="transition-colors hover:text-[#c61c2f]">
            {t('why')}
          </Link>
          <Link
            href="#pricing"
            className="transition-colors hover:text-[#c61c2f]"
          >
            {t('pricing')}
          </Link>
        </div>
      </div>
    </motion.footer>
  );
}
