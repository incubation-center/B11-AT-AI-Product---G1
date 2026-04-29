'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { forgotPassword } from '@/lib/auth';
import Link from 'next/link';

export function ForgotPasswordForm() {
  const t = useTranslations('auth');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState('');
  const [lastRequestedEmail, setLastRequestedEmail] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    startTransition(async () => {
      try {
        const normalizedEmail = email.trim();
        await forgotPassword({ email: normalizedEmail });
        setSuccess(t('successResetSent'));
        setLastRequestedEmail(normalizedEmail);
        setEmail('');
      } catch (submitError) {
        setError(
          submitError instanceof Error
            ? submitError.message
            : t('errors.failedSendReset'),
        );
      }
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-8">
      <div className="w-full max-w-[420px]">
        <div className="mb-10 flex items-center justify-center gap-2 text-lg font-semibold lg:hidden">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
            <span className="text-sm font-bold text-primary">C</span>
          </div>
          <span>Coolhat</span>
        </div>

        <div className="mb-10 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#c61c2f]">
            {t('forgotPasswordEyebrow')}
          </p>
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-[#002e6b]">
            {t('resetYourPassword')}
          </h1>
          <p className="text-sm text-black">{t('forgotPasswordHelp')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="py-2 text-md font-medium text-black"
            >
              {t('email')}
            </Label>
            <Input
              id="email"
              type="email"
              placeholder={t('ownerEmailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 rounded-xl border-slate-200 bg-slate-50 text-black focus:border-[#002e6b]"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {success && (
            <div className="space-y-3 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              <p>{success}</p>
              <Link
                href={
                  lastRequestedEmail
                    ? `/reset-password?email=${encodeURIComponent(lastRequestedEmail)}`
                    : '/reset-password'
                }
                className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-[#002e6b] px-4 text-sm font-medium text-white transition-colors hover:bg-[#003d8f]"
              >
                {t('iHaveResetCode')}
              </Link>
            </div>
          )}

          <Button
            type="submit"
            className="h-12 w-full rounded-xl bg-[#002e6b] text-base font-medium text-white hover:bg-[#003d8f]"
            disabled={isPending}
          >
            {isPending ? t('sending') : t('sendResetCode')}
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-black">
          {t('knowYourPassword')}{' '}
          <Link
            href="/sign-in"
            className="font-semibold text-[#c61c2f] hover:underline"
          >
            {t('signIn')}
          </Link>
        </p>
      </div>
    </div>
  );
}
