'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { resetPassword, verifyResetCode } from '@/lib/auth';
import Link from 'next/link';

interface ResetPasswordFormProps {
  token?: string;
  initialEmail?: string;
}

export function ResetPasswordForm({ token, initialEmail }: ResetPasswordFormProps) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState(initialEmail ?? '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!token && !email.trim()) {
      setError('Email is required');
      return;
    }

    if (!token && !code.trim()) {
      setError('Reset code is required');
      return;
    }

    startTransition(async () => {
      try {
        let resolvedToken = token;

        if (!resolvedToken) {
          const verifyResponse = await verifyResetCode({
            email: email.trim(),
            code: code.trim(),
          });
          resolvedToken = verifyResponse.token;
        }

        await resetPassword({ token: resolvedToken, password });
        setSuccess('Password reset successfully!');
        setTimeout(() => {
          router.push('/sign-in');
        }, 2000);
      } catch (submitError) {
        setError(
          submitError instanceof Error
            ? submitError.message
            : 'Failed to reset password',
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
            Reset Password
          </p>
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-[#002e6b]">
            Create a new password
          </h1>
          <p className="text-sm text-black">
            {token
              ? 'Enter a new password for your account.'
              : 'Enter your email, reset code, and a new password.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!token && (
            <>
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="py-2 text-md font-medium text-black"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="owner@shop.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required={!token}
                  className="h-12 rounded-xl border-slate-200 bg-slate-50 text-black focus:border-[#002e6b]"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="reset-code"
                  className="py-2 text-md font-medium text-black"
                >
                  Reset Code
                </Label>
                <Input
                  id="reset-code"
                  type="text"
                  inputMode="numeric"
                  placeholder="6-digit code"
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  required={!token}
                  maxLength={6}
                  className="h-12 rounded-xl border-slate-200 bg-slate-50 text-black focus:border-[#002e6b]"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="py-2 text-md font-medium text-black"
            >
              New Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 rounded-xl border-slate-200 bg-slate-50 pr-10 text-black focus:border-[#002e6b]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="size-5" />
                ) : (
                  <Eye className="size-5" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="confirm-password"
              className="py-2 text-md font-medium text-black"
            >
              Confirm Password
            </Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-12 rounded-xl border-slate-200 bg-slate-50 pr-10 text-black focus:border-[#002e6b]"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={
                  showConfirmPassword ? 'Hide password' : 'Show password'
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              >
                {showConfirmPassword ? (
                  <EyeOff className="size-5" />
                ) : (
                  <Eye className="size-5" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              {success}
            </div>
          )}

          <Button
            type="submit"
            className="h-12 w-full rounded-xl bg-[#002e6b] text-base font-medium text-white hover:bg-[#003d8f]"
            disabled={isPending}
          >
            {isPending
              ? 'Resetting...'
              : token
                ? 'Reset Password'
                : 'Verify Code & Reset Password'}
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-black">
          Know your password?{' '}
          <Link
            href="/sign-in"
            className="font-semibold text-[#c61c2f] hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
