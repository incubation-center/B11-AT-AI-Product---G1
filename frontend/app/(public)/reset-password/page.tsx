import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import { redirectIfAuthenticated } from '@/lib/auth-server';

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string; email?: string }>;
}

export default async function ResetPasswordPage(props: ResetPasswordPageProps) {
  await redirectIfAuthenticated();

  const searchParams = await props.searchParams;
  const token = searchParams.token;
  const email = searchParams.email;

  return <ResetPasswordForm token={token} initialEmail={email} />;
}
