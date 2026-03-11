import { StoreSetupForm } from "@/components/onboarding/store-setup-form";
import { requireStoreOnboarding } from "@/lib/auth-server";

export default async function StoreOnboardingPage() {
  await requireStoreOnboarding();
  return <StoreSetupForm />;
}
