import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/sign-in-form";
import { redirectIfAuthenticated } from "@/lib/auth-server";

export default async function SignInPage() {
  await redirectIfAuthenticated();

  return (
    <AuthShell
      title="Sign in to your Coolhat workspace"
      description="Public routes do not require login. Use this page to start a Better Auth session, then enter the protected owner area."
    >
      <SignInForm />
    </AuthShell>
  );
}
