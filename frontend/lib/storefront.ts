export type StorefrontStore = {
  id: string;
  shopName: string;
  shopType: string;
  description: string | null;
  addressText: string | null;
  googleMapUrl: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  storefrontTemplate: string | null;
  subdomain: string;
  storeUrl: string;
  isActive: boolean;
};

export type PublicStoreSummary = Pick<
  StorefrontStore,
  | 'id'
  | 'shopName'
  | 'shopType'
  | 'description'
  | 'logoUrl'
  | 'bannerUrl'
  | 'subdomain'
  | 'storeUrl'
  | 'isActive'
>;

export type StorefrontProduct = {
  id: string;
  name: string;
  description: string | null;
  basePriceUsd: string | null;
  basePriceKhr: string | null;
  imageUrls: string[];
  category: string | null;
  hasVariants: boolean;
  trackInventory: boolean;
  stockQty: number;
  lowStockThreshold: number;
  isActive: boolean;
};

const SERVER_API_URL =
  process.env.INTERNAL_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://backend:8080';

function stripPort(host: string) {
  return host.replace(/:\d+$/, '');
}

export function extractStoreSubdomain(host: string) {
  const hostname = stripPort(host.trim().toLowerCase());

  if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1') {
    return null;
  }

  if (hostname.endsWith('.localhost')) {
    return hostname.slice(0, -'.localhost'.length) || null;
  }

  if (hostname.endsWith('.lvh.me')) {
    return hostname.slice(0, -'.lvh.me'.length) || null;
  }

  if (hostname.endsWith('.127.0.0.1.nip.io')) {
    return hostname.slice(0, -'.127.0.0.1.nip.io'.length) || null;
  }

  const parts = hostname.split('.');
  return parts.length >= 3 ? parts[0] || null : null;
}

export async function getStorefrontBySubdomain(subdomain: string) {
  const storeResponse = await fetch(
    `${SERVER_API_URL}/store/by-subdomain/${subdomain}`,
    {
      cache: 'no-store',
    },
  );

  if (!storeResponse.ok) {
    return null;
  }

  const productResponse = await fetch(
    `${SERVER_API_URL}/store/by-subdomain/${subdomain}/products?page_size=24`,
    {
      cache: 'no-store',
    },
  );

  const storePayload = (await storeResponse.json()) as {
    store: StorefrontStore;
  };
  const productPayload = productResponse?.ok
    ? ((await productResponse.json()) as { products: StorefrontProduct[] })
    : { products: [] };

  return {
    store: storePayload.store,
    products: productPayload.products ?? [],
  };
}

export async function getPublicStores(limit = 24) {
  let response: Response;
  try {
    response = await fetch(`${SERVER_API_URL}/store/public?limit=${limit}`, {
      cache: 'no-store',
    });
  } catch {
    return [] as PublicStoreSummary[];
  }

  if (!response.ok) {
    return [] as PublicStoreSummary[];
  }

  const payload = (await response.json()) as { stores?: PublicStoreSummary[] };
  return payload.stores ?? [];
}
