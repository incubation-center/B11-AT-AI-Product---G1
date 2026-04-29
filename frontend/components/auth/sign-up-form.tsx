'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

import { AnimatedSignUp } from '@/components/ui/animated-auth';
import { signUpWithEmail } from '@/lib/auth';

export function SignUpForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(name: string, email: string, password: string) {
    setError('');
    setSuccess('');
    startTransition(async () => {
      try {
        await signUpWithEmail({
          name,
          email,
          password,
          callbackURL: `${window.location.origin}/dashboard`,
          rememberMe: true,
        });
        setSuccess(t('successAccountCreated'));
        router.push('/sign-in');
      } catch (submitError) {
        setError(
          submitError instanceof Error
            ? submitError.message
            : t('errors.unableSignUp'),
        );
      }
    });
  }

  return (
    <AnimatedSignUp
      onSubmit={handleSubmit}
      error={error}
      success={success}
      isPending={isPending}
      signInHref="/sign-in"
    />
  );
}
