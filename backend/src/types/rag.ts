export type PineconeMetadata = {
  tenantId: string;
  entityType: "tenant_profile" | "product";
  entityId: string;
  subdomain?: string;
  shopType?: string;
  productCategory?: string;
  isActive: boolean;
  relationTenantNode: string;
  relationNode: string;
  text: string;
};
