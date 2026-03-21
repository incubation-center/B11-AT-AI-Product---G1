export const queryKeys = {
  products: ["products"] as const,
  productList: (params?: { page_size?: number; include_inactive?: boolean; q?: string }) =>
    [...queryKeys.products, "list", params ?? {}] as const,
  subdomainPreview: (shopName: string) => ["subdomain-preview", shopName] as const,
};
