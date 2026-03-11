export const SHOP_TYPES = [
  "beauty_cosmetics",
  "fashion",
  "food_beverage",
  "electronic",
  "services",
  "others",
] as const;

export type ShopType = (typeof SHOP_TYPES)[number];

export const STOREFRONT_TEMPLATES = [
  "boutique-editorial",
  "market-grid",
  "catalog-flow",
] as const;

export type StorefrontTemplate = (typeof STOREFRONT_TEMPLATES)[number];

export type CreateTenantInput = {
  shopName: string;
  shopType: ShopType;
  description?: string | null;
  addressText?: string | null;
  googleMapUrl?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  storefrontTemplate?: StorefrontTemplate | null;
};

export type UpdateTenantInput = Partial<CreateTenantInput> & {
  isActive?: boolean;
};

export type TenantConflictResult = {
  code: "SUBDOMAIN_CONFLICT" | "TENANT_EXISTS";
  message: string;
  generatedSubdomain?: string;
  alternatives?: string[];
  existingTenantId?: string;
};
