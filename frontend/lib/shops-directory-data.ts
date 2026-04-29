import {
  getPublicStores,
  getStorefrontBySubdomain,
  type PublicStoreSummary,
} from '@/lib/storefront';

export type DirectoryProduct = {
  id: string;
  name: string;
  imageUrls: string[];
  basePriceUsd: string | null;
  shopName: string;
  subdomain: string;
  category?: string | null;
};

export type ShopsDirectoryData = {
  stores: PublicStoreSummary[];
  products: DirectoryProduct[];
  categories: string[];
};

const MOCK_STORES: PublicStoreSummary[] = [
  {
    id: 'mock-1',
    shopName: 'May Store',
    shopType: 'fashion',
    description:
      'Streetwear drops, everyday essentials, and curated accessories.',
    logoUrl: '/Lacoste-logo.png',
    bannerUrl: '/shop5.jpg',
    subdomain: 'may-store',
    storeUrl: '/shops/may-store',
    isActive: true,
  },
  {
    id: 'mock-2',
    shopName: 'PKA Select',
    shopType: 'beauty',
    description: 'Skin-care and beauty picks tested for daily routine comfort.',
    logoUrl: '/pka.jpg',
    bannerUrl: '/shop3.webp',
    subdomain: 'pka-select',
    storeUrl: '/shops/pka-select',
    isActive: true,
  },
  {
    id: 'mock-3',
    shopName: 'Weyoung Lab',
    shopType: 'lifestyle',
    description:
      'Modern lifestyle products with playful colors and clean forms.',
    logoUrl: '/weyoung.jpg',
    bannerUrl: '/Bare.jpg',
    subdomain: 'weyoung-lab',
    storeUrl: '/shops/weyoung-lab',
    isActive: true,
  },
  {
    id: 'mock-4',
    shopName: 'Bare Goods',
    shopType: 'home',
    description: 'Home and daily utility goods designed for simple living.',
    logoUrl: '/Bare.jpg',
    bannerUrl: '/channel.png',
    subdomain: 'bare-goods',
    storeUrl: '/shops/bare-goods',
    isActive: true,
  },
  {
    id: 'mock-5',
    shopName: 'Channel Corner',
    shopType: 'electronics',
    description: 'Smart accessories, compact gadgets, and creator-ready tools.',
    logoUrl: '/channel.png',
    bannerUrl: '/shops.svg',
    subdomain: 'channel-corner',
    storeUrl: '/shops/channel-corner',
    isActive: true,
  },
  {
    id: 'mock-6',
    shopName: 'Globe Picks',
    shopType: 'grocery',
    description: 'Daily pantry picks and fast-moving essentials for the week.',
    logoUrl: '/globe.svg',
    bannerUrl: '/shop5.jpg',
    subdomain: 'globe-picks',
    storeUrl: '/shops/globe-picks',
    isActive: true,
  },
];

const MOCK_PRODUCTS: DirectoryProduct[] = [
  {
    id: 'mock-p1',
    name: 'Classic Cotton Tee',
    imageUrls: ['/shop5.jpg'],
    basePriceUsd: '19.00',
    shopName: 'May Store',
    subdomain: 'may-store',
    category: 'fashion',
  },
  {
    id: 'mock-p2',
    name: 'Slim Crossbody Bag',
    imageUrls: ['/shop3.webp'],
    basePriceUsd: '26.00',
    shopName: 'May Store',
    subdomain: 'may-store',
    category: 'fashion',
  },
  {
    id: 'mock-p3',
    name: 'Hydration Essence',
    imageUrls: ['/pka.jpg'],
    basePriceUsd: '22.00',
    shopName: 'PKA Select',
    subdomain: 'pka-select',
    category: 'beauty',
  },
  {
    id: 'mock-p4',
    name: 'Glow Serum 30ml',
    imageUrls: ['/channel.png'],
    basePriceUsd: '29.00',
    shopName: 'PKA Select',
    subdomain: 'pka-select',
    category: 'beauty',
  },
  {
    id: 'mock-p5',
    name: 'Color Mug Set',
    imageUrls: ['/weyoung.jpg'],
    basePriceUsd: '14.00',
    shopName: 'Weyoung Lab',
    subdomain: 'weyoung-lab',
    category: 'lifestyle',
  },
  {
    id: 'mock-p6',
    name: 'Soft Light Lamp',
    imageUrls: ['/Bare.jpg'],
    basePriceUsd: '32.00',
    shopName: 'Bare Goods',
    subdomain: 'bare-goods',
    category: 'home',
  },
  {
    id: 'mock-p7',
    name: 'Wireless Earbuds Lite',
    imageUrls: ['/channel.png'],
    basePriceUsd: '34.00',
    shopName: 'Channel Corner',
    subdomain: 'channel-corner',
    category: 'electronics',
  },
  {
    id: 'mock-p8',
    name: 'Fresh Pantry Box',
    imageUrls: ['/shop5.jpg'],
    basePriceUsd: '18.00',
    shopName: 'Globe Picks',
    subdomain: 'globe-picks',
    category: 'grocery',
  },
];

const MOCK_CATEGORIES = [
  'fashion',
  'beauty',
  'lifestyle',
  'home',
  'electronics',
  'grocery',
];

function normalizeCategory(value: string | null | undefined) {
  return (value ?? 'general').replaceAll('_', ' ');
}

export async function getShopsDirectoryData(): Promise<ShopsDirectoryData> {
  const liveStores = await getPublicStores(48);
  const stores = liveStores.length > 0 ? liveStores : [...MOCK_STORES];

  if (liveStores.length === 0) {
    return {
      stores,
      products: [...MOCK_PRODUCTS],
      categories: [...MOCK_CATEGORIES],
    };
  }

  const storefrontDetails = await Promise.all(
    stores
      .slice(0, 10)
      .map((store) => getStorefrontBySubdomain(store.subdomain)),
  );

  const liveProducts: DirectoryProduct[] = storefrontDetails.flatMap(
    (storefront) => {
      if (!storefront?.store) {
        return [];
      }

      return storefront.products
        .filter((product) => product.isActive)
        .map((product) => ({
          id: product.id,
          name: product.name,
          imageUrls: product.imageUrls,
          basePriceUsd: product.basePriceUsd,
          shopName: storefront.store.shopName,
          subdomain: storefront.store.subdomain,
          category: product.category ?? storefront.store.shopType,
        }));
    },
  );

  const categories = Array.from(
    new Set(stores.map((store) => normalizeCategory(store.shopType))),
  );

  return {
    stores,
    products: liveProducts.length > 0 ? liveProducts : [...MOCK_PRODUCTS],
    categories: categories.length > 0 ? categories : [...MOCK_CATEGORIES],
  };
}
