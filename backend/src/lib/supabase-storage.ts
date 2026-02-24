import { createClient } from "@supabase/supabase-js";
import type { AssetType, SignedUploadResult } from "../types/storage";

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

function getFileExt(fileName: string, contentType: string): string {
  const cleanedName = fileName.trim().toLowerCase();
  const fromName = cleanedName.includes(".") ? cleanedName.split(".").pop() : "";
  if (fromName) {
    return fromName.replace(/[^a-z0-9]/g, "");
  }

  const byMime: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/svg+xml": "svg",
    "image/avif": "avif",
  };

  return byMime[contentType] ?? "bin";
}

function sanitizePathPart(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export async function createStoreAssetSignedUpload(input: {
  type: AssetType;
  fileName: string;
  contentType: string;
  ownerUserId: string;
}): Promise<SignedUploadResult> {
  const supabaseUrl = requireEnv("SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "store-assets";

  const contentType = input.contentType.trim().toLowerCase();
  if (!imageMimeTypes.has(contentType)) {
    throw new Error("Unsupported image type. Use jpeg, png, webp, gif, svg, or avif.");
  }

  const ext = getFileExt(input.fileName, contentType);
  const safeOwnerId = sanitizePathPart(input.ownerUserId);
  const random = crypto.randomUUID().slice(0, 8);
  const path = `tenants/${safeOwnerId}/${input.type}-${Date.now()}-${random}.${ext}`;

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path);
  if (error || !data?.signedUrl) {
    throw new Error(error?.message ?? "Unable to create signed upload URL.");
  }

  const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path);
  const signedUrl = data.signedUrl.startsWith("http")
    ? data.signedUrl
    : `${supabaseUrl.replace(/\/$/, "")}${data.signedUrl.startsWith("/") ? "" : "/"}${data.signedUrl}`;

  return {
    path,
    signedUrl,
    publicUrl: publicData.publicUrl,
    bucket,
  };
}
