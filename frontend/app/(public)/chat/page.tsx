import { GlobalAiSearch } from '@/components/global-search/global-ai-search';

export const metadata = {
  title: 'Ask Coolhat — AI Product Discovery',
  description:
    'Search for products across all Coolhat SME stores using AI. Describe what you need and get instant, personalized recommendations with direct store links.',
};

export default function ChatPage() {
  return <GlobalAiSearch />;
}
