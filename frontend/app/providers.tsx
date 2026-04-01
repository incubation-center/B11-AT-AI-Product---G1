'use client';

import {
  QueryClient,
  QueryClientProvider,
  useIsFetching,
  useIsMutating,
} from '@tanstack/react-query';
import { HeroUIProvider } from '@heroui/react';
import { useState } from 'react';

import { GlobalLoadingSplash } from '@/components/ui/global-loading-splash';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <HeroUIProvider>{children}</HeroUIProvider>
      <HeroUIProvider>
        <AppActivityBoundary>{children}</AppActivityBoundary>
      </HeroUIProvider>
    </QueryClientProvider>
  );
}

function AppActivityBoundary({ children }: ProvidersProps) {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const pendingCount = isFetching + isMutating;
  const busy = pendingCount > 0;

  return (
    <>
      <div className={busy ? 'pointer-events-none select-none' : undefined}>
        {children}
      </div>
      <GlobalLoadingSplash busy={busy} pendingCount={pendingCount} />
    </>
  );
}
