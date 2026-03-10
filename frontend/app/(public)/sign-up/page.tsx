import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { redirectIfAuthenticated } from "@/lib/auth-server";

export default async function SignUpPage() {
  await redirectIfAuthenticated();

  return (
    <AuthShell
      title="Create your Coolhat owner account"
      description="This route also stays public. After signup, the backend sends email verification and your frontend can continue with normal sign-in."
    >
      <SignUpForm />
    </AuthShell>
  );
}
