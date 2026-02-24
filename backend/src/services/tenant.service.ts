import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { tenants, users } from "../db/schema";
import { getOrCreateProfile } from "./profile.service";
import { aiClient } from "../lib/ai-client";
import type { SessionUser } from "../types/auth";
import type { CreateTenantInput, TenantConflictResult, UpdateTenantInput } from "../types/tenant";

function cleanText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const cleaned = value.trim();
  return cleaned ? cleaned : null;
}

function normalizeStoreAssetRef(value: unknown): string | null {
  const cleaned = cleanText(value);
  if (!cleaned) {
    return null;
  }

  if (/^https?:\/\//i.test(cleaned)) {
    return cleaned;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) {
    return cleaned;
  }

  const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "store-assets";
  const rawPath = cleaned.replace(/^\/+/, "").replace(new RegExp(`^${bucket}/`), "");
  return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${bucket}/${rawPath}`;
}

function slugifyShopName(shopName: string): string {
  const normalized = shopName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const slug = normalized.replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  if (slug) {
    return slug;
  }

  let hash = 0;
  for (let i = 0; i < shopName.length; i += 1) {
    hash = (hash * 31 + shopName.charCodeAt(i)) >>> 0;
  }
  return `store-${hash.toString(36)}`;
}

async function buildSubdomainConflict(baseSubdomain: string): Promise<TenantConflictResult> {
  const alternatives: string[] = [];
  for (let i = 2; i <= 4; i += 1) {
    const suggestion = `${baseSubdomain}-${i}`;
    const existing = await db.query.tenants.findFirst({
      where: eq(tenants.subdomain, suggestion),
      columns: { id: true },
    });
    if (!existing) {
      alternatives.push(suggestion);
    }
  }

  return {
    code: "SUBDOMAIN_CONFLICT",
    message:
      "Generated subdomain already exists. Please choose a more unique shop_name. Suggestions are provided just in case.",
    generatedSubdomain: baseSubdomain,
    alternatives,
  };
}

async function findOwnerTenant(ownerUserId: string) {
  return db.query.tenants.findFirst({
    where: eq(tenants.ownerUserId, ownerUserId),
  });
}

function triggerTenantIndex(tenantId: string) {
  void aiClient.indexTenant(tenantId).catch((error) => {
    console.error("[rag] indexTenant failed", { tenantId, error });
  });
}

export async function getMyTenant(authUser: SessionUser) {
  const profile = await getOrCreateProfile(authUser);
  if (!profile) {
    return null;
  }

  const tenant = await findOwnerTenant(profile.id);
  if (!tenant) {
    if (profile.tenantId !== null) {
      await db
        .update(users)
        .set({
          tenantId: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, profile.id));
    }
    return null;
  }

  if (profile.tenantId !== tenant.id) {
    await db
      .update(users)
      .set({
        tenantId: tenant.id,
        updatedAt: new Date(),
      })
      .where(eq(users.id, profile.id));
  }

  return tenant;
}

export async function createMyTenant(authUser: SessionUser, input: CreateTenantInput) {
  const profile = await getOrCreateProfile(authUser);
  if (!profile) {
    throw new Error("Unable to resolve user profile.");
  }

  const existingTenant = await findOwnerTenant(profile.id);
  if (existingTenant) {
    const conflict: TenantConflictResult = {
      code: "TENANT_EXISTS",
      message: "You already have a store tenant.",
      existingTenantId: existingTenant.id,
    };
    return { tenant: null, conflict };
  }

  const shopName = input.shopName.trim();
  const baseSubdomain = slugifyShopName(shopName);
  const subdomainTaken = await db.query.tenants.findFirst({
    where: eq(tenants.subdomain, baseSubdomain),
    columns: { id: true },
  });

  if (subdomainTaken) {
    const conflict = await buildSubdomainConflict(baseSubdomain);
    return { tenant: null, conflict };
  }

  const inserted = await db
    .insert(tenants)
    .values({
      ownerUserId: profile.id,
      shopName,
      shopType: input.shopType,
      description: cleanText(input.description),
      addressText: cleanText(input.addressText),
      googleMapUrl: cleanText(input.googleMapUrl),
      logoUrl: normalizeStoreAssetRef(input.logoUrl),
      bannerUrl: normalizeStoreAssetRef(input.bannerUrl),
      subdomain: baseSubdomain,
      isActive: true,
    })
    .returning();

  const tenant = inserted[0];
  await db
    .update(users)
    .set({
      tenantId: tenant.id,
      updatedAt: new Date(),
    })
    .where(eq(users.id, profile.id));

  triggerTenantIndex(tenant.id);
  return { tenant, conflict: null };
}

export async function updateMyTenant(authUser: SessionUser, input: UpdateTenantInput) {
  const profile = await getOrCreateProfile(authUser);
  if (!profile) {
    throw new Error("Unable to resolve user profile.");
  }

  const tenant = await findOwnerTenant(profile.id);
  if (!tenant) {
    return { tenant: null, conflict: null };
  }

  const patch: Partial<typeof tenants.$inferInsert> = {
    updatedAt: new Date(),
  };

  const nextShopName = cleanText(input.shopName);
  if (nextShopName && nextShopName !== tenant.shopName) {
    const nextSubdomain = slugifyShopName(nextShopName);
    const conflictTenant = await db.query.tenants.findFirst({
      where: eq(tenants.subdomain, nextSubdomain),
      columns: { id: true },
    });
    if (conflictTenant && conflictTenant.id !== tenant.id) {
      const conflict = await buildSubdomainConflict(nextSubdomain);
      return { tenant: null, conflict };
    }

    patch.shopName = nextShopName;
    patch.subdomain = nextSubdomain;
  }

  if (input.shopType) patch.shopType = input.shopType;
  if (input.description !== undefined) patch.description = cleanText(input.description);
  if (input.addressText !== undefined) patch.addressText = cleanText(input.addressText);
  if (input.googleMapUrl !== undefined) patch.googleMapUrl = cleanText(input.googleMapUrl);
  if (input.logoUrl !== undefined) patch.logoUrl = normalizeStoreAssetRef(input.logoUrl);
  if (input.bannerUrl !== undefined) patch.bannerUrl = normalizeStoreAssetRef(input.bannerUrl);
  if (typeof input.isActive === "boolean") patch.isActive = input.isActive;

  const updated = await db
    .update(tenants)
    .set(patch)
    .where(eq(tenants.id, tenant.id))
    .returning();

  const nextTenant = updated[0] ?? null;
  if (nextTenant) {
    triggerTenantIndex(nextTenant.id);
  }

  return { tenant: nextTenant, conflict: null };
}

export async function deactivateMyTenant(authUser: SessionUser) {
  const result = await updateMyTenant(authUser, { isActive: false });
  return result.tenant;
}

export async function checkSubdomainByShopName(shopName: string) {
  const generatedSubdomain = slugifyShopName(shopName);
  const existing = await db.query.tenants.findFirst({
    where: eq(tenants.subdomain, generatedSubdomain),
    columns: { id: true },
  });

  const available = !existing;
  const suggestions: string[] = [];

  if (!available) {
    for (let i = 2; i <= 4; i += 1) {
      const candidate = `${generatedSubdomain}-${i}`;
      const taken = await db.query.tenants.findFirst({
        where: eq(tenants.subdomain, candidate),
        columns: { id: true },
      });
      if (!taken) suggestions.push(candidate);
    }
  }

  return {
    available,
    generatedSubdomain,
    suggestions,
  };
}

export async function getStoreBySubdomain(subdomain: string) {
  return db.query.tenants.findFirst({
    where: and(eq(tenants.subdomain, subdomain), eq(tenants.isActive, true)),
    columns: {
      id: true,
      shopName: true,
      shopType: true,
      description: true,
      addressText: true,
      googleMapUrl: true,
      logoUrl: true,
      bannerUrl: true,
      subdomain: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}
