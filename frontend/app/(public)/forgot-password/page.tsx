import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import { redirectIfAuthenticated } from '@/lib/auth-server';

export default async function ForgotPasswordPage() {
  await redirectIfAuthenticated();
  return <ForgotPasswordForm />;
}
