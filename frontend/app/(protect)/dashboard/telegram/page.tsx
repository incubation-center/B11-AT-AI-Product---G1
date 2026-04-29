'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import {
  useTelegramLinkStatus,
  useGenerateTelegramCode,
} from '@/hooks/use-telegram-queries';
import { TelegramStatusCard } from '@/components/dashboard/telegram-status-card';
import { TelegramConnectGuide } from '@/components/dashboard/telegram-connect-guide';
import { Info } from 'lucide-react';

export default function TelegramPage() {
  const t = useTranslations('dashboard.telegramPage');
  const {
    data: status,
    isLoading: statusLoading,
    refetch,
  } = useTelegramLinkStatus();

  const generateCodeMutation = useGenerateTelegramCode();

  const handleRefresh = () => {
    refetch();
  };

  const handleGenerateCode = async () => {
    await generateCodeMutation.mutateAsync(undefined);
  };

  return (
    <div className="flex flex-col gap-8 py-4">
      {/* Header section */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1>{t('title')}</h1>
          <p className="text-default-500 mt-1">{t('subtitle')}</p>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 md:grid-cols-[400px_1fr] gap-8">
        <div className="flex flex-col gap-6">
          <TelegramStatusCard
            status={status}
            isLoading={statusLoading}
            onRefresh={handleRefresh}
          />

          <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 flex gap-4">
            <div className="shrink-0 text-blue-500">
              <Info size={20} />
            </div>
            <p className="text-xs leading-relaxed text-blue-700">{t('info')}</p>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <TelegramConnectGuide
            status={status}
            isGenerating={generateCodeMutation.isPending}
            onGenerateCode={handleGenerateCode}
          />
        </div>
      </div>
    </div>
  );
}
