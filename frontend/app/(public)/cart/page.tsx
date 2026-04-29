import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

import { StorefrontCartPage } from '@/components/storefront/themes/storefront-cart-page';
import {
  extractStoreSubdomain,
  getStorefrontBySubdomain,
} from '@/lib/storefront';

export default async function PublicCartPage() {
  const headerStore = await headers();
  const host =
    headerStore.get('x-forwarded-host') ?? headerStore.get('host') ?? '';
  const subdomain = extractStoreSubdomain(host);

  if (!subdomain) {
    redirect('/');
  }

  const storefront = await getStorefrontBySubdomain(subdomain);

  if (!storefront?.store) {
    notFound();
  }

  return <StorefrontCartPage store={storefront.store} />;
}
