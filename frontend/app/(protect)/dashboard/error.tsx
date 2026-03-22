'use client';

import { Button } from '@heroui/react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="flex flex-col items-center justify-center gap-6 py-20">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Something went wrong</h2>
        <p className="text-default-500 mt-2">{error.message}</p>
      </div>
      <Button color="primary" onPress={reset}>
        Try again
      </Button>
    </main>
  );
}
