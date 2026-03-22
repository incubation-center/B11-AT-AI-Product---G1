import { SignInForm } from '@/components/auth/sign-in-form';
import { redirectIfAuthenticated } from '@/lib/auth-server';

export default async function SignInPage() {
  await redirectIfAuthenticated();
  return <SignInForm />;
}
