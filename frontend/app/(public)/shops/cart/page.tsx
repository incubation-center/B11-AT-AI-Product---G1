import { BuyerShopView } from '@/components/storefront/buyer-shop-view';
import type { StorefrontStore } from '@/lib/storefront';

const GLOBAL_STORE: StorefrontStore = {
  id: 'global-storefront',
  shopName: 'CoolHat Shops',
  shopType: 'global',
  description: null,
  addressText: null,
  googleMapUrl: null,
  logoUrl: null,
  bannerUrl: null,
  storefrontTemplate: null,
  subdomain: 'global',
  storeUrl: '/shops',
  isActive: true,
};

export default function GlobalCartPage() {
  return <BuyerShopView store={GLOBAL_STORE} products={[]} activeTab="cart" />;
}
