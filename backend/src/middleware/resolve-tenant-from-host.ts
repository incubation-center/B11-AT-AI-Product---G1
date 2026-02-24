import type { Context, MiddlewareHandler } from "hono";
import { getStoreBySubdomain } from "../services/tenant.service";

function getRequestHost(c: Context): string {
  const forwardedHost = c.req.header("x-forwarded-host");
  const host = forwardedHost || c.req.header("host") || "";
  return host.trim().toLowerCase();
}

function stripPort(host: string): string {
  return host.replace(/:\d+$/, "");
}

function extractSubdomain(hostname: string): string | null {
  if (!hostname || hostname === "localhost" || hostname === "127.0.0.1") return null;

  if (hostname.endsWith(".localhost")) {
    return hostname.slice(0, -".localhost".length) || null;
  }

  if (hostname.endsWith(".lvh.me")) {
    return hostname.slice(0, -".lvh.me".length) || null;
  }

  if (hostname.endsWith(".127.0.0.1.nip.io")) {
    return hostname.slice(0, -".127.0.0.1.nip.io".length) || null;
  }

  const parts = hostname.split(".");
  if (parts.length < 3) return null;
  return parts[0] || null;
}

export const resolveTenantFromHost: MiddlewareHandler = async (c, next) => {
  const hostname = stripPort(getRequestHost(c));
  const subdomain = extractSubdomain(hostname);

  if (!subdomain) {
    c.set("resolvedSubdomain", null);
    c.set("resolvedTenant", null);
    return next();
  }

  const tenant = await getStoreBySubdomain(subdomain);
  c.set("resolvedSubdomain", subdomain);
  c.set("resolvedTenant", tenant ?? null);
  return next();
};
