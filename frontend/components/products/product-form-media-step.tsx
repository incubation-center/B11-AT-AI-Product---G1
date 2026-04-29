// Feature component — Product Form Media Step
'use client';

import { Cloud, AlertCircle, X } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('products.form.media');
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const handleAddFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;

    const filesArray = Array.from(newFiles);
    const totalFiles = imageFiles.length + filesArray.length;

    if (totalFiles > MAX_IMAGES) {
      alert(t('maxImages', { count: MAX_IMAGES }));
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
            {t('productImages')} <span className="text-red-500">*</span>
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
                {t('uploadCta')}
              </p>
              <p className="text-xs text-default-500">{t('uploadHint')}</p>
            </div>
            <input
              id="image-upload"
              type="file"
              className="hidden"
              accept="image/*"
              disabled={isLoading}
              aria-label={t('uploadAria')}
              multiple
              onChange={(e) => handleAddFiles(e.target.files)}
            />
          </label>
        )}

        {/* Image Previews Grid */}
        {imageFiles.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-default-500 px-1">
              {t('uploadedImages')}
            </p>
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
                    aria-label={t('removeImageAria')}
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
          {t('guidelinePrefix')}{' '}
          <span className="font-semibold">
            {t('guidelineCount', { count: MAX_IMAGES })}
          </span>
          . {t('guidelineSuffix')}
        </p>

        {/* Existing Image Alert */}
        {hasExistingImage && imageFiles.length === 0 && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
            <div className="text-blue-600 flex-shrink-0 mt-0.5">
              <AlertCircle className="h-4 w-4" />
            </div>
            <p className="text-xs text-blue-700">{t('existingImagesKept')}</p>
          </div>
        )}

        {/* Validation Error */}
        {!isValid && !hasExistingImage && imageFiles.length === 0 && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
            <div className="text-red-600 flex-shrink-0 mt-0.5">
              <AlertCircle className="h-4 w-4" />
            </div>
            <p className="text-xs text-red-700">{t('atLeastOneImage')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
