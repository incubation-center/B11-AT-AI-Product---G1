import { TemplateSelector } from "@/components/onboarding/template-selector";
import { requireTemplateOnboarding } from "@/lib/auth-server";

export default async function TemplateOnboardingPage() {
  await requireTemplateOnboarding();
  return <TemplateSelector />;
}
