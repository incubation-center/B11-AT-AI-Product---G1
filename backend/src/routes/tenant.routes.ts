import { Hono } from "hono";
import type { Context } from "hono";
import { auth } from "../auth/config";
import { requireBearer } from "../middleware/require-bearer";
import { resolveTenantFromHost } from "../middleware/resolve-tenant-from-host";
import { uploadStoreAssetToCloudinary } from "../lib/cloudinary";
import { withStoreUrl } from "../lib/store-url";
import {
  checkSubdomainByShopName,
  createMyTenant,
  deactivateMyTenant,
  getMyTenant,
  getStoreBySubdomain,
  updateMyTenant,
} from "../services/tenant.service";

const shopTypes = [
  "beauty_cosmetics",
  "fashion",
  "food_beverage",
  "electronic",
  "services",
  "others",
] as const;
type ShopType = (typeof shopTypes)[number];
const shopTypeSet = new Set<ShopType>(shopTypes);

async function getSessionUser(c: Context) {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });
  return session?.user ?? null;
}

function cleanSubdomain(raw: string): string {
  return raw.trim().toLowerCase();
}

export const tenantRoutes = new Hono();

tenantRoutes.get("/me/tenant", requireBearer, async (c) => {
  const sessionUser = await getSessionUser(c);
  if (!sessionUser) return c.json({ message: "Unauthorized" }, 401);

  const tenant = await getMyTenant(sessionUser);
  return c.json({
    hasTenant: !!tenant,
    tenant: tenant ? withStoreUrl(tenant) : null,
  });
});

tenantRoutes.post("/tenants", requireBearer, async (c) => {
  const sessionUser = await getSessionUser(c);
  if (!sessionUser) return c.json({ message: "Unauthorized" }, 401);

  const body = await c.req.json().catch(() => null);
  const shopName = typeof body?.shop_name === "string" ? body.shop_name.trim() : "";
  const shopType = typeof body?.shop_type === "string" ? body.shop_type : "";

  if (!shopName) return c.json({ message: "shop_name is required" }, 400);
  if (!shopTypeSet.has(shopType as ShopType)) {
    return c.json({ message: "shop_type is invalid" }, 400);
  }

  const { tenant, conflict } = await createMyTenant(sessionUser, {
    shopName,
    shopType: shopType as ShopType,
    description: body?.description ?? null,
    addressText: body?.address_text ?? null,
    googleMapUrl: body?.google_map_url ?? null,
    logoUrl: body?.logo_url ?? null,
    bannerUrl: body?.banner_url ?? null,
  });

  if (conflict) {
    return c.json(conflict, 409);
  }

  return c.json({ message: "Tenant created", tenant: tenant ? withStoreUrl(tenant) : null }, 201);
});

tenantRoutes.patch("/me/tenant", requireBearer, async (c) => {
  const sessionUser = await getSessionUser(c);
  if (!sessionUser) return c.json({ message: "Unauthorized" }, 401);

  const body = await c.req.json().catch(() => null);
  const shopType = body?.shop_type;
  if (shopType !== undefined && (typeof shopType !== "string" || !shopTypeSet.has(shopType as ShopType))) {
    return c.json({ message: "shop_type is invalid" }, 400);
  }

  const { tenant, conflict } = await updateMyTenant(sessionUser, {
    shopName: body?.shop_name,
    shopType,
    description: body?.description,
    addressText: body?.address_text,
    googleMapUrl: body?.google_map_url,
    logoUrl: body?.logo_url,
    bannerUrl: body?.banner_url,
    isActive: body?.is_active,
  });

  if (conflict) return c.json(conflict, 409);
  if (!tenant) return c.json({ message: "Tenant not found" }, 404);

  return c.json({ message: "Tenant updated", tenant: withStoreUrl(tenant) });
});

tenantRoutes.patch("/tenants/:id", requireBearer, async (c) => {
  const sessionUser = await getSessionUser(c);
  if (!sessionUser) return c.json({ message: "Unauthorized" }, 401);

  const tenantId = c.req.param("id")?.trim();
  if (!tenantId) return c.json({ message: "tenant id is required" }, 400);

  const currentTenant = await getMyTenant(sessionUser);
  if (!currentTenant) return c.json({ message: "Tenant not found" }, 404);
  if (currentTenant.id !== tenantId) return c.json({ message: "Forbidden" }, 403);

  const body = await c.req.json().catch(() => null);
  const shopType = body?.shop_type;
  if (shopType !== undefined && (typeof shopType !== "string" || !shopTypeSet.has(shopType as ShopType))) {
    return c.json({ message: "shop_type is invalid" }, 400);
  }

  const { tenant, conflict } = await updateMyTenant(sessionUser, {
    shopName: body?.shop_name,
    shopType,
    description: body?.description,
    addressText: body?.address_text,
    googleMapUrl: body?.google_map_url,
    logoUrl: body?.logo_url,
    bannerUrl: body?.banner_url,
    isActive: body?.is_active,
  });

  if (conflict) return c.json(conflict, 409);
  if (!tenant) return c.json({ message: "Tenant not found" }, 404);

  return c.json({ message: "Tenant updated", tenant: withStoreUrl(tenant) });
});

tenantRoutes.patch("/me/tenant/deactivate", requireBearer, async (c) => {
  const sessionUser = await getSessionUser(c);
  if (!sessionUser) return c.json({ message: "Unauthorized" }, 401);

  const tenant = await deactivateMyTenant(sessionUser);
  if (!tenant) return c.json({ message: "Tenant not found" }, 404);

  return c.json({
    message: "Tenant deactivated",
    tenant: withStoreUrl(tenant),
  });
});

tenantRoutes.patch("/tenants/:id/deactivate", requireBearer, async (c) => {
  const sessionUser = await getSessionUser(c);
  if (!sessionUser) return c.json({ message: "Unauthorized" }, 401);

  const tenantId = c.req.param("id")?.trim();
  if (!tenantId) return c.json({ message: "tenant id is required" }, 400);

  const currentTenant = await getMyTenant(sessionUser);
  if (!currentTenant) return c.json({ message: "Tenant not found" }, 404);
  if (currentTenant.id !== tenantId) return c.json({ message: "Forbidden" }, 403);

  const tenant = await deactivateMyTenant(sessionUser);
  if (!tenant) return c.json({ message: "Tenant not found" }, 404);

  return c.json({
    message: "Tenant deactivated",
    tenant: withStoreUrl(tenant),
  });
});

tenantRoutes.get("/tenants/subdomain-available", async (c) => {
  const shopName = c.req.query("shop_name")?.trim() ?? "";
  if (!shopName) return c.json({ message: "shop_name query is required" }, 400);

  const result = await checkSubdomainByShopName(shopName);
  return c.json(result);
});

tenantRoutes.get("/store/by-subdomain/:subdomain", async (c) => {
  const subdomain = cleanSubdomain(c.req.param("subdomain"));
  if (!subdomain) return c.json({ message: "subdomain is required" }, 400);

  const store = await getStoreBySubdomain(subdomain);
  if (!store) return c.json({ message: "Store not found" }, 404);

  return c.json({ store: withStoreUrl(store) });
});

tenantRoutes.get("/store/by-host", resolveTenantFromHost, async (c) => {
  const subdomain = c.get("resolvedSubdomain") as string | null;
  const store = c.get("resolvedTenant") as Awaited<ReturnType<typeof getStoreBySubdomain>> | null;

  if (!subdomain) {
    return c.json({ message: "No subdomain found in host" }, 400);
  }
  if (!store) {
    return c.json({ message: "Store not found" }, 404);
  }

  return c.json({ subdomain, store: withStoreUrl(store) });
});

tenantRoutes.post("/tenants/upload-url", requireBearer, async (c) => {
  const sessionUser = await getSessionUser(c);
  if (!sessionUser) return c.json({ message: "Unauthorized" }, 401);

  const form = await c.req.formData().catch(() => null);
  const type = form?.get("type");
  const file = form?.get("file");

  if (type !== "logo" && type !== "banner") {
    return c.json({ message: "type must be logo or banner" }, 400);
  }
  if (!(file instanceof File)) {
    return c.json({ message: "file is required" }, 400);
  }
  if (file.size <= 0) {
    return c.json({ message: "file is empty" }, 400);
  }

  try {
    const upload = await uploadStoreAssetToCloudinary({
      type,
      file,
      ownerUserId: sessionUser.id,
    });

    return c.json({
      message: "Image uploaded",
      upload,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to upload image";
    return c.json({ message }, 400);
  }
});
