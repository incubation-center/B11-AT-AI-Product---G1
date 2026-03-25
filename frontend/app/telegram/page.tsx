import { Suspense } from 'react';
import TelegramMiniAppClient from './telegram-mini-app-client';

function TelegramMiniAppLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Loading Telegram Mini App...</p>
      </div>
    </div>
  );
}

export default function TelegramMiniAppPage() {
  return (
    <Suspense fallback={<TelegramMiniAppLoading />}>
      <TelegramMiniAppClient />
    </Suspense>
  );
}
