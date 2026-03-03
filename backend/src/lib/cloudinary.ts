import { createHash, randomUUID } from "node:crypto";
import type { AssetType, CloudinaryUploadResult } from "../types/storage";

const imageMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/avif",
]);

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required.`);
  }
  return value;
}

function sanitizePathPart(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function parseCloudinaryUrl() {
  const raw = requireEnv("CLOUDINARY_URL");
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error("CLOUDINARY_URL is invalid.");
  }

  if (parsed.protocol !== "cloudinary:") {
    throw new Error("CLOUDINARY_URL must start with cloudinary://");
  }

  const apiKey = decodeURIComponent(parsed.username);
  const apiSecret = decodeURIComponent(parsed.password);
  const cloudName = parsed.hostname;

  if (!apiKey || !apiSecret || !cloudName) {
    throw new Error("CLOUDINARY_URL must include api key, secret, and cloud name.");
  }

  return { apiKey, apiSecret, cloudName };
}

function signCloudinaryParams(params: Record<string, string | number>, apiSecret: string): string {
  const payload = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && `${value}`.length > 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return createHash("sha1")
    .update(`${payload}${apiSecret}`)
    .digest("hex");
}

async function uploadImageToCloudinary(input: {
  file: File;
  folder: string;
  publicId: string;
}): Promise<CloudinaryUploadResult> {
  const { apiKey, apiSecret, cloudName } = parseCloudinaryUrl();

  const contentType = input.file.type.trim().toLowerCase();
  if (!imageMimeTypes.has(contentType)) {
    throw new Error("Unsupported image type. Use jpeg, png, webp, gif, svg, or avif.");
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signCloudinaryParams(
    {
      folder: input.folder,
      public_id: input.publicId,
      timestamp,
    },
    apiSecret
  );

  const body = new FormData();
  body.set("file", input.file);
  body.set("api_key", apiKey);
  body.set("timestamp", String(timestamp));
  body.set("folder", input.folder);
  body.set("public_id", input.publicId);
  body.set("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body,
  });

  const text = await res.text();
  let data: any = text;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = text;
  }

  if (!res.ok) {
    const message = data?.error?.message ?? "Cloudinary upload failed.";
    throw new Error(message);
  }

  const publicUrl = data?.secure_url;
  if (typeof publicUrl !== "string" || !publicUrl) {
    throw new Error("Cloudinary upload did not return secure_url.");
  }

  return {
    publicUrl,
    assetId: typeof data?.asset_id === "string" ? data.asset_id : "",
    publicId: typeof data?.public_id === "string" ? data.public_id : "",
    resourceType: typeof data?.resource_type === "string" ? data.resource_type : "image",
    format: typeof data?.format === "string" ? data.format : "",
    bytes: typeof data?.bytes === "number" ? data.bytes : 0,
  };
}

export async function uploadStoreAssetToCloudinary(input: {
  type: AssetType;
  file: File;
  ownerUserId: string;
}): Promise<CloudinaryUploadResult> {
  const safeOwnerId = sanitizePathPart(input.ownerUserId);
  const folder = `tenants/${safeOwnerId}/${input.type}`;
  const publicId = `${input.type}-${Date.now()}-${randomUUID().slice(0, 8)}`;
  return uploadImageToCloudinary({
    file: input.file,
    folder,
    publicId,
  });
}

export async function uploadProductImageToCloudinary(input: {
  file: File;
  tenantId: string;
  productId: string;
}): Promise<CloudinaryUploadResult> {
  const safeTenantId = sanitizePathPart(input.tenantId);
  const safeProductId = sanitizePathPart(input.productId);
  const folder = `tenants/${safeTenantId}/products/${safeProductId}`;
  const publicId = `product-${Date.now()}-${randomUUID().slice(0, 8)}`;
  return uploadImageToCloudinary({
    file: input.file,
    folder,
    publicId,
  });
}

export async function uploadTelegramDraftImageToCloudinary(input: {
  file: File;
  tenantId: string;
  telegramUserId: number;
}): Promise<CloudinaryUploadResult> {
  const safeTenantId = sanitizePathPart(input.tenantId);
  const safeTelegramUserId = sanitizePathPart(String(input.telegramUserId));
  const folder = `tenants/${safeTenantId}/products/telegram-drafts/${safeTelegramUserId}`;
  const publicId = `telegram-product-${Date.now()}-${randomUUID().slice(0, 8)}`;

  return uploadImageToCloudinary({
    file: input.file,
    folder,
    publicId,
  });
}
