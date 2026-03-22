import { API_URL, createTenant } from '@/lib/auth';

export type SubdomainPreview = {
  available: boolean;
  generatedSubdomain: string;
  suggestions: string[];
} | null;

export async function getSubdomainPreview(shopName: string) {
  const response = await fetch(
    `${API_URL}/tenants/subdomain-available?shop_name=${encodeURIComponent(shopName)}`,
    {
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    throw new Error('Unable to check subdomain availability');
  }

  return (await response.json()) as SubdomainPreview;
}

export { createTenant };
