"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

import { CTAButton } from "@/components/ui/cta-button";
import { signUpWithEmail } from "@/lib/auth";

export function SignUpForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    startTransition(async () => {
      try {
        await signUpWithEmail({
          name,
          email,
          password,
          callbackURL: `${window.location.origin}/dashboard`,
          rememberMe: true,
        });
        setSuccess(
          "Account created. Check your email verification link, then sign in."
        );
        router.push("/sign-in");
      } catch (submitError) {
        setError(
          submitError instanceof Error ? submitError.message : "Unable to sign up"
        );
      }
    });
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c61c2f]">
          Sign up
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-[#002e6b]">
          Create your owner account
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          This uses the backend endpoint <code>/api/auth/sign-up/email</code> with
          <code>credentials: &quot;include&quot;</code> so Better Auth can issue its
          session cookie.
        </p>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">
          Full name
        </span>
        <input
          name="name"
          type="text"
          required
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#002e6b]"
          placeholder="John Doe"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
        <input
          name="email"
          type="email"
          required
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#002e6b]"
          placeholder="owner@shop.com"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">
          Password
        </span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#002e6b]"
          placeholder="At least 8 characters"
        />
      </label>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <CTAButton type="submit" className="w-full py-6 text-sm" isLoading={isPending}>
        Create account
      </CTAButton>

      <p className="text-sm text-slate-600">
        Already registered?{" "}
        <Link href="/sign-in" className="font-semibold text-[#c61c2f]">
          Sign in
        </Link>
      </p>
    </form>
  );
}
