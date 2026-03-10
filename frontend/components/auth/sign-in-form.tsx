"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

import { CTAButton } from "@/components/ui/cta-button";
import { signInWithEmail } from "@/lib/auth";

export function SignInForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    startTransition(async () => {
      try {
        await signInWithEmail({
          email,
          password,
          callbackURL: `${window.location.origin}/dashboard`,
          rememberMe: true,
        });
        router.push("/dashboard");
        router.refresh();
      } catch (submitError) {
        setError(
          submitError instanceof Error ? submitError.message : "Unable to sign in"
        );
      }
    });
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c61c2f]">
          Sign in
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-[#002e6b]">
          Access your owner workspace
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          This route lives in <code>app/(public)</code>, so it stays reachable
          without a session.
        </p>
      </div>

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
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#002e6b]"
          placeholder="Enter your password"
        />
      </label>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <CTAButton type="submit" className="w-full py-6 text-sm" isLoading={isPending}>
        Sign in
      </CTAButton>

      <p className="text-sm text-slate-600">
        Need an account?{" "}
        <Link href="/sign-up" className="font-semibold text-[#c61c2f]">
          Create one here
        </Link>
      </p>
    </form>
  );
}
