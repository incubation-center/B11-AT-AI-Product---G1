// Feature component — Product Form Media Step
'use client';

import { Cloud, AlertCircle, X } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';

interface ProductFormMediaStepProps {
  imageFiles: File[];
  onImageFilesChange: (files: File[]) => void;
  hasExistingImage: boolean;
  isLoading: boolean;
  isValid: boolean;
}

const MAX_IMAGES = 3;

export function ProductFormMediaStep({
  imageFiles,
  onImageFilesChange,
  hasExistingImage,
  isLoading,
  isValid,
}: ProductFormMediaStepProps) {
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const handleAddFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;

    const filesArray = Array.from(newFiles);
    const totalFiles = imageFiles.length + filesArray.length;

    if (totalFiles > MAX_IMAGES) {
      alert(`You can upload a maximum of ${MAX_IMAGES} images`);
      return;
    }

    const updatedFiles = [...imageFiles, ...filesArray];
    onImageFilesChange(updatedFiles);

    // Generate preview URLs for new files
    const newUrls = filesArray.map((file) => URL.createObjectURL(file));
    setPreviewUrls([...previewUrls, ...newUrls]);
  };

  const handleRemoveFile = (index: number) => {
    const updatedFiles = imageFiles.filter((_, i) => i !== index);
    onImageFilesChange(updatedFiles);

    // Revoke object URL and update previews
    URL.revokeObjectURL(previewUrls[index]);
    const updatedUrls = previewUrls.filter((_, i) => i !== index);
    setPreviewUrls(updatedUrls);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-default-900 block">
            Product Images <span className="text-red-500">*</span>
          </label>
          <span className="text-xs text-default-500">
            {imageFiles.length}/{MAX_IMAGES}
          </span>
        </div>

        {/* Upload Drop Zone */}
        {imageFiles.length < MAX_IMAGES && (
          <label
            htmlFor="image-upload"
            className={`flex flex-col items-center justify-center w-full h-48 sm:h-64 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
              isLoading
                ? 'bg-default-100 border-default-200 opacity-50 cursor-not-allowed'
                : 'bg-default-50 border-default-300 hover:bg-default-100 hover:border-default-400'
            }`}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4">
              <Cloud className="h-10 w-10 text-default-400 mb-2" />
              <p className="mb-1 text-sm font-medium text-default-700">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-default-500">
                PNG, JPG, GIF up to 10MB
              </p>
            </div>
            <input
              id="image-upload"
              type="file"
              className="hidden"
              accept="image/*"
              disabled={isLoading}
              aria-label="Upload product image"
              multiple
              onChange={(e) => handleAddFiles(e.target.files)}
            />
          </label>
        )}

        {/* Image Previews Grid */}
        {imageFiles.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-default-500 px-1">Uploaded images:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {previewUrls.map((url, index) => (
                <div
                  key={index}
                  className="relative group aspect-square rounded-lg overflow-hidden border border-default-200 bg-default-50"
                >
                  <Image
                    src={url}
                    alt={`Preview ${index + 1}`}
                    fill
                    sizes="(max-width: 640px) 50vw, 33vw"
                    unoptimized
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    disabled={isLoading}
                    aria-label="Remove image"
                    className="absolute top-1 right-1 bg-danger-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <p className="absolute bottom-1 left-1 right-1 text-xs bg-black/50 text-white px-2 py-1 rounded truncate">
                    {imageFiles[index].name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Text */}
        <p className="text-xs text-default-500 px-1">
          Upload high-quality, square images (1:1 aspect ratio) for best
          results. You can upload up to{' '}
          <span className="font-semibold">{MAX_IMAGES} images</span>. Additional
          images can be added after saving.
        </p>

        {/* Existing Image Alert */}
        {hasExistingImage && imageFiles.length === 0 && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
            <div className="text-blue-600 flex-shrink-0 mt-0.5">
              <AlertCircle className="h-4 w-4" />
            </div>
            <p className="text-xs text-blue-700">
              Existing images will be kept if no new images are uploaded.
            </p>
          </div>
        )}

        {/* Validation Error */}
        {!isValid && !hasExistingImage && imageFiles.length === 0 && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
            <div className="text-red-600 flex-shrink-0 mt-0.5">
              <AlertCircle className="h-4 w-4" />
            </div>
            <p className="text-xs text-red-700">
              At least one image is required.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
