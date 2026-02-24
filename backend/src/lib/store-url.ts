export function buildStoreUrl(subdomain: string): string {
  const cleanedSubdomain = subdomain.trim().toLowerCase();
  const protocol = process.env.STORE_URL_PROTOCOL?.trim() || "http";
  const baseDomain = process.env.STORE_BASE_DOMAIN?.trim() || "lvh.me";
  const port = process.env.STORE_URL_PORT?.trim() || "3000";

  const base = port ? `${baseDomain}:${port}` : baseDomain;
  return `${protocol}://${cleanedSubdomain}.${base}`;
}

export function withStoreUrl<T extends { subdomain: string }>(tenant: T): T & { storeUrl: string } {
  return {
    ...tenant,
    storeUrl: buildStoreUrl(tenant.subdomain),
  };
}
