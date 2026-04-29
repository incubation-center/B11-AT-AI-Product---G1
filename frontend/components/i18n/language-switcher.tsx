'use client';

import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';

import { locales, type Locale } from '@/i18n/config';

export function LanguageSwitcher() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('navbar');

  return (
    <label className="flex items-center gap-2 text-xs text-[#002e6b]">
      <span className="hidden md:inline">{t('language')}</span>
      <select
        className="rounded-md border border-[#002e6b]/20 bg-white px-2 py-1 text-xs"
        value={locale}
        onChange={(event) => {
          const nextLocale = event.target.value as Locale;
          if (!locales.includes(nextLocale) || nextLocale === locale) {
            return;
          }

          document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
          router.refresh();
        }}
      >
        <option value="en">{t('english')}</option>
        <option value="km">{t('khmer')}</option>
      </select>
    </label>
  );
}
