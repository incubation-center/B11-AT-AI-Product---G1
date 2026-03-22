'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { CTAButton } from '@/components/ui/cta-button';
import { signOut } from '@/lib/auth';

export function SignOutButton() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      <CTAButton
        type="button"
        tone="secondary"
        variant="bordered"
        isLoading={isPending}
        onPress={() =>
          startTransition(async () => {
            setError('');

            try {
              await signOut();
              router.push('/sign-in');
              router.refresh();
            } catch (submitError) {
              setError(
                submitError instanceof Error
                  ? submitError.message
                  : 'Unable to sign out',
              );
            }
          })
        }
      >
        Sign out
      </CTAButton>
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}
