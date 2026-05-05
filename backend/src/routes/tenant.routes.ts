import { Hono } from "hono";
import type { Context } from "hono";
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
import { getCurrentSubscriptionByTenantId, toSubscriptionSummary } from "../services/subscription.service";
import { SHOP_TYPES, STOREFRONT_TEMPLATES } from "../types/tenant";
import type { CreateTenantInput, ShopType, StorefrontTemplate, UpdateTenantInput } from "../types/tenant";
import type { SessionUser } from "../types/auth";

const shopTypeSet = new Set<ShopType>(SHOP_TYPES);
const storefrontTemplateSet = new Set<StorefrontTemplate>(STOREFRONT_TEMPLATES);

function unauthorized(c: Context) {
  return c.json({ message: "Unauthorized" }, 401);
}

function getAuthUser(c: Context): SessionUser | null {
  try {
    return c.get("authUser");
  } catch {
    return null;
  }
}

function cleanSubdomain(raw: string): string {
  return raw.trim().toLowerCase();
}

function parseShopType(value: unknown, required: boolean): { value: ShopType | undefined; message: string | null } {
  if (value === undefined || value === null) {
    if (required) return { value: undefined, message: "shop_type is invalid" };
    return { value: undefined, message: null };
  }

  if (typeof value !== "string" || !shopTypeSet.has(value as ShopType)) {
    return { value: undefined, message: "shop_type is invalid" };
  }

  return { value: value as ShopType, message: null };
}

function parseStorefrontTemplate(value: unknown): { value: StorefrontTemplate | null | undefined; message: string | null } {
  if (value === undefined) return { value: undefined, message: null };
  if (value === null) return { value: null, message: null };

  if (typeof value !== "string" || !storefrontTemplateSet.has(value as StorefrontTemplate)) {
    return { value: undefined, message: "storefront_template is invalid" };
  }

  return { value: value as StorefrontTemplate, message: null };
}

function parseCreateTenantInput(body: any): { input: CreateTenantInput | null; message: string | null } {
  const shopName = typeof body?.shop_name === "string" ? body.shop_name.trim() : "";
  if (!shopName) return { input: null, message: "shop_name is required" };

  const shopType = parseShopType(body?.shop_type, true);
  if (shopType.message || !shopType.value) return { input: null, message: "shop_type is invalid" };

  const storefrontTemplate = parseStorefrontTemplate(body?.storefront_template);
  if (storefrontTemplate.message) return { input: null, message: storefrontTemplate.message };

  return {
    input: {
      shopName,
      shopType: shopType.value,
      description: body?.description ?? null,
      addressText: body?.address_text ?? null,
      googleMapUrl: body?.google_map_url ?? null,
      logoUrl: body?.logo_url ?? null,
      bannerUrl: body?.banner_url ?? null,
      paywayLinkUrl: body?.payway_link_url ?? null,
      storefrontTemplate: storefrontTemplate.value ?? null,
    },
    message: null,
  };
}

function parseUpdateTenantInput(body: any): { input: UpdateTenantInput | null; message: string | null } {
  const shopType = parseShopType(body?.shop_type, false);
  if (shopType.message) return { input: null, message: shopType.message };

  const storefrontTemplate = parseStorefrontTemplate(body?.storefront_template);
  if (storefrontTemplate.message) return { input: null, message: storefrontTemplate.message };

  return {
    input: {
      shopName: body?.shop_name,
      shopType: shopType.value,
      description: body?.description,
      addressText: body?.address_text,
      googleMapUrl: body?.google_map_url,
      logoUrl: body?.logo_url,
      bannerUrl: body?.banner_url,
      paywayLinkUrl: body?.payway_link_url,
      storefrontTemplate: storefrontTemplate.value,
      isActive: body?.is_active,
    },
    message: null,
  };
}

async function ensureOwnedTenant(c: Context, sessionUser: SessionUser, tenantId: string) {
  const currentTenant = await getMyTenant(sessionUser);
  if (!currentTenant) return { response: c.json({ message: "Tenant not found" }, 404) };
  if (currentTenant.id !== tenantId) return { response: c.json({ message: "Forbidden" }, 403) };
  return { response: null };
}

async function handleTenantUpdate(c: Context, sessionUser: SessionUser) {
  const body = await c.req.json().catch(() => null);
  const parsed = parseUpdateTenantInput(body);
  if (parsed.message || !parsed.input) {
    return c.json({ message: parsed.message ?? "Invalid tenant payload" }, 400);
  }

  const result = await updateMyTenant(sessionUser, parsed.input).catch((error) => {
    const message = error instanceof Error ? error.message : "Unable to update tenant";
    return { error: message };
  });
  if ("error" in result) return c.json({ message: result.error }, 400);

  const { tenant, conflict } = result;
  if (conflict) return c.json(conflict, 409);
  if (!tenant) return c.json({ message: "Tenant not found" }, 404);

  return c.json({ message: "Tenant updated", tenant: withStoreUrl(tenant) });
}

export const tenantRoutes = new Hono();

tenantRoutes.get("/me/tenant", requireBearer, async (c) => {
  const sessionUser = getAuthUser(c);
  if (!sessionUser) return unauthorized(c);

  const tenant = await getMyTenant(sessionUser);
  const subscription = tenant ? await getCurrentSubscriptionByTenantId(tenant.id) : null;
  return c.json({
    hasTenant: !!tenant,
    tenant: tenant ? withStoreUrl(tenant) : null,
    subscription: toSubscriptionSummary(subscription ?? null),
  });
});

tenantRoutes.post("/tenants", requireBearer, async (c) => {
  const sessionUser = getAuthUser(c);
  if (!sessionUser) return unauthorized(c);

  const body = await c.req.json().catch(() => null);
  const parsed = parseCreateTenantInput(body);
  if (parsed.message || !parsed.input) return c.json({ message: parsed.message ?? "Invalid tenant payload" }, 400);

  const result = await createMyTenant(sessionUser, parsed.input).catch((error) => {
    const message = error instanceof Error ? error.message : "Unable to create tenant";
    return { error: message };
  });
  if ("error" in result) return c.json({ message: result.error }, 400);

  const { tenant, conflict } = result;

  if (conflict) {
    return c.json(conflict, 409);
  }

  return c.json({ message: "Tenant created", tenant: tenant ? withStoreUrl(tenant) : null }, 201);
});

tenantRoutes.patch("/me/tenant", requireBearer, async (c) => {
  const sessionUser = getAuthUser(c);
  if (!sessionUser) return unauthorized(c);
  return handleTenantUpdate(c, sessionUser);
});

tenantRoutes.patch("/tenants/:id", requireBearer, async (c) => {
  const sessionUser = getAuthUser(c);
  if (!sessionUser) return unauthorized(c);

  const tenantId = c.req.param("id")?.trim();
  if (!tenantId) return c.json({ message: "tenant id is required" }, 400);

  const ownership = await ensureOwnedTenant(c, sessionUser, tenantId);
  if (ownership.response) return ownership.response;

  return handleTenantUpdate(c, sessionUser);
});

tenantRoutes.patch("/me/tenant/deactivate", requireBearer, async (c) => {
  const sessionUser = getAuthUser(c);
  if (!sessionUser) return unauthorized(c);

  const tenant = await deactivateMyTenant(sessionUser);
  if (!tenant) return c.json({ message: "Tenant not found" }, 404);

  return c.json({
    message: "Tenant deactivated",
    tenant: withStoreUrl(tenant),
  });
});

tenantRoutes.patch("/tenants/:id/deactivate", requireBearer, async (c) => {
  const sessionUser = getAuthUser(c);
  if (!sessionUser) return unauthorized(c);

  const tenantId = c.req.param("id")?.trim();
  if (!tenantId) return c.json({ message: "tenant id is required" }, 400);

  const ownership = await ensureOwnedTenant(c, sessionUser, tenantId);
  if (ownership.response) return ownership.response;

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
  const subdomain = c.get("resolvedSubdomain");
  const store = c.get("resolvedTenant");

  if (!subdomain) {
    return c.json({ message: "No subdomain found in host" }, 400);
  }
  if (!store) {
    return c.json({ message: "Store not found" }, 404);
  }

  return c.json({ subdomain, store: withStoreUrl(store) });
});

tenantRoutes.post("/tenants/upload-url", requireBearer, async (c) => {
  const sessionUser = getAuthUser(c);
  if (!sessionUser) return unauthorized(c);

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
