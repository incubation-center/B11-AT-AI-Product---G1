export type PineconeMetadata = {
  tenantId: string;
  entityType: "tenant_profile" | "product" | "product_variant";
  entityId: string;
  subdomain?: string;
  shopName?: string;
  shopType?: string;
  productCategory?: string;
  productId?: string;
  variantId?: string;
  variantSize?: string;
  variantColor?: string;
  isActive: boolean;
  relationTenantNode: string;
  relationNode: string;
  text: string;
};
