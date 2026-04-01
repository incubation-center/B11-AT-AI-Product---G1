import { Suspense } from 'react';
import TelegramMiniAppClient from './telegram-mini-app-client';

export default function TelegramMiniAppPage() {
  return (
    <Suspense fallback={null}>
      <TelegramMiniAppClient />
    </Suspense>
  );
}
