'use client';

import { Button } from '@heroui/react';
import { useTranslations } from 'next-intl';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const t = useTranslations('dashboard.error');
  return (
    <main className="flex flex-col items-center justify-center gap-6 py-20">
      <div className="text-center">
        <h2 className="text-2xl font-bold">{t('title')}</h2>
        <p className="text-default-500 mt-2">{error.message}</p>
      </div>
      <Button color="primary" onPress={reset}>
        {t('tryAgain')}
      </Button>
    </main>
  );
}
