"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { AnimatedSignUp } from "@/components/ui/animated-auth";
import { signUpWithEmail } from "@/lib/auth";

export function SignUpForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(name: string, email: string, password: string) {
    setError("");
    setSuccess("");
    startTransition(async () => {
      try {
        await signUpWithEmail({
          name,
          email,
          password,
          callbackURL: `${window.location.origin}/dashboard`,
          rememberMe: true,
        });
        setSuccess("Account created. Check your email verification link, then sign in.");
        router.push("/sign-in");
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "Unable to sign up");
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


