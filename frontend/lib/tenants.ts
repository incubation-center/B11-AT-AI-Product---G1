import { API_URL, createTenant, protectedFetch, type TenantSummary } from '@/lib/auth';

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

export async function deactivateMyTenant() {
  return protectedFetch<{ message: string; tenant: TenantSummary | null }>(
    '/me/tenant/deactivate',
    {
      method: 'PATCH',
    },
  );
}

export async function uploadTenantAsset(type: 'logo' | 'banner', file: File) {
  const formData = new FormData();
  formData.append('type', type);
  formData.append('file', file);

  return protectedFetch<{
    message: string;
    upload: {
      publicUrl: string;
      assetId: string;
    };
  }>('/tenants/upload-url', {
    method: 'POST',
    body: formData,
    // FormData handles its own content-type with boundary
  });
}

export { createTenant };
