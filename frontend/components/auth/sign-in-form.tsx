'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

import { AnimatedSignIn } from '@/components/ui/animated-auth';
import { signInWithEmail } from '@/lib/auth';

export function SignInForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(email: string, password: string) {
    setError('');
    startTransition(async () => {
      try {
        await signInWithEmail({
          email,
          password,
          callbackURL: `${window.location.origin}/dashboard`,
          rememberMe: true,
        });
        router.push('/dashboard');
        router.refresh();
      } catch (submitError) {
        setError(
          submitError instanceof Error
            ? submitError.message
            : t('errors.unableSignIn'),
        );
      }
    });
  }

  return (
    <AnimatedSignIn
      onSubmit={handleSubmit}
      error={error}
      isPending={isPending}
      signUpHref="/sign-up"
    />
  );
}
