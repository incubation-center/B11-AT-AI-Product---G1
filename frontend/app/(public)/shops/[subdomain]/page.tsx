import { notFound } from 'next/navigation';

import { BuyerShopView } from '@/components/storefront/buyer-shop-view';
import { getStorefrontBySubdomain } from '@/lib/storefront';

type ShopPageProps = {
  params: Promise<{ subdomain: string }>;
};

export default async function ShopExplorePage({ params }: ShopPageProps) {
  const { subdomain } = await params;
  const storefront = await getStorefrontBySubdomain(subdomain);

  if (!storefront?.store) {
    notFound();
  }

  return (
    <BuyerShopView
      store={storefront.store}
      products={storefront.products}
      activeTab="explore"
    />
  );
}
