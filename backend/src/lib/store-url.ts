import { env } from "../env";

export function buildStoreUrl(subdomain: string): string {
  const cleanedSubdomain = subdomain.trim().toLowerCase();
  const protocol = env.STORE_URL_PROTOCOL;
  const baseDomain = env.STORE_BASE_DOMAIN.trim();
  const port = env.STORE_URL_PORT.trim();

  const base = port ? `${baseDomain}:${port}` : baseDomain;
  return `${protocol}://${cleanedSubdomain}.${base}`;
}

export function withStoreUrl<T extends { subdomain: string }>(tenant: T): T & { storeUrl: string } {
  return {
    ...tenant,
    storeUrl: buildStoreUrl(tenant.subdomain),
  };
}
