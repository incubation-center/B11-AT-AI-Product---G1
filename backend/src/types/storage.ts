export type AssetType = "logo" | "banner";

export type CloudinaryUploadResult = {
  publicUrl: string;
  assetId: string;
  publicId: string;
  resourceType: string;
  format: string;
  bytes: number;
};

export type SignedUploadResult = {
  path: string;
  signedUrl: string;
  publicUrl: string;
  bucket: string;
};
