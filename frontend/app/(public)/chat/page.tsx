import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { GlobalAiSearch } from '@/components/global-search/global-ai-search';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');

  return {
    title: t('chatTitle'),
    description: t('chatDescription'),
  };
}

export default function ChatPage() {
  return <GlobalAiSearch />;
}
