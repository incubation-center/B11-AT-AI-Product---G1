'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Card,
  CardHeader,
  CardBody,
  Input,
  Button,
  Select,
  SelectItem,
  Divider,
} from '@heroui/react';
import { Store, Palette, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { TenantSummary } from '@/lib/auth';
import Image from 'next/image';
import { StorefrontThemePreviewCard } from '@/components/storefront/theme-preview-card';
import {
  normalizeStorefrontTheme,
  STOREFRONT_THEME_OPTIONS,
  toStorefrontThemeApiValue,
  type StorefrontThemeId,
} from '@/lib/storefront-themes';

const SHOP_CATEGORIES = [
  { id: 'beauty_cosmetics', name: 'Beauty & Cosmetics' },
  { id: 'fashion', name: 'Fashion & Apparel' },
  { id: 'food_beverage', name: 'Food & Beverage' },
  { id: 'electronic', name: 'Electronics' },
  { id: 'services', name: 'Services' },
  { id: 'others', name: 'Others' },
];

interface StoreSettingsProps {
  tenant: TenantSummary | null;
  onUpdateStore: (payload: Record<string, unknown>) => Promise<unknown>;
  isUpdatingStore: boolean;
  onUploadAsset: (type: 'logo' | 'banner', file: File) => void;
  isUploadingAsset: boolean;
}

export function StoreSettings({
  tenant,
  onUpdateStore,
  isUpdatingStore,
  onUploadAsset,
  isUploadingAsset,
}: StoreSettingsProps) {
  const t = useTranslations('settings.store');
  const [shopName, setShopName] = useState(tenant?.shopName || '');
  const [shopDescription, setShopDescription] = useState(
    tenant?.description || '',
  );
  const [shopType, setShopType] = useState(tenant?.shopType || '');
  const [paywayLinkUrl, setPaywayLinkUrl] = useState(
    tenant?.paywayLinkUrl || '',
  );
  const [selectedTemplate, setSelectedTemplate] = useState(
    normalizeStorefrontTheme(tenant?.storefrontTemplate),
  );
  const [themeSaveError, setThemeSaveError] = useState('');

  const handleSelectTemplate = async (templateId: StorefrontThemeId) => {
    if (isUpdatingStore) return;

    const nextTemplate = normalizeStorefrontTheme(templateId);
    const previousTemplate = selectedTemplate;
    setThemeSaveError('');
    setSelectedTemplate(nextTemplate);

    try {
      await onUpdateStore({
        storefront_template: toStorefrontThemeApiValue(nextTemplate),
      });
    } catch (error) {
      setSelectedTemplate(previousTemplate);
      setThemeSaveError(
        error instanceof Error ? error.message : t('unableSaveTheme'),
      );
    }
  };

  const handleUpdateStore = async () => {
    setThemeSaveError('');
    try {
      await onUpdateStore({
        shop_name: shopName,
        description: shopDescription,
        shop_type: shopType,
        storefront_template: toStorefrontThemeApiValue(selectedTemplate),
        payway_link_url: paywayLinkUrl.trim() || null,
      });
    } catch (error) {
      setThemeSaveError(
        error instanceof Error ? error.message : t('unableUpdateStore'),
      );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card className="border-none bg-white/60 backdrop-blur-md shadow-sm">
        <CardHeader className="flex gap-3">
          <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
            <Palette size={20} />
          </div>
          <div className="flex flex-col">
            <p className="text-md font-bold">{t('brandingTheme')}</p>
            <p className="text-small text-default-500">
              {t('brandingThemeDesc')}
            </p>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="gap-8 py-6 font-semibold shadow-sm">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <div className="space-y-1">
                <p className="text-sm">{t('storefrontTheme')}</p>
                <p className="text-xs font-medium text-default-500">
                  {t('storefrontThemeDesc')}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {STOREFRONT_THEME_OPTIONS.map((tmpl) => (
                  <StorefrontThemePreviewCard
                    key={tmpl.id}
                    option={tmpl}
                    selected={selectedTemplate === tmpl.id}
                    onSelect={handleSelectTemplate}
                    logoUrl={tenant?.logoUrl}
                    bannerUrl={tenant?.bannerUrl}
                    shopName={shopName || tenant?.shopName || t('yourStore')}
                  />
                ))}
              </div>
              {themeSaveError ? (
                <p className="text-sm font-medium text-danger">
                  {themeSaveError}
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
              <div className="flex flex-col gap-3">
                <p className="text-sm">{t('storeLogo')}</p>
                <div className="relative group">
                  <div className="relative w-full h-32 bg-default-50 rounded-xl border-2 border-dashed border-default-200 flex flex-col items-center justify-center overflow-hidden">
                    {tenant?.logoUrl ? (
                      <Image
                        src={tenant.logoUrl}
                        alt="Logo"
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-contain p-2"
                      />
                    ) : (
                      <ImageIcon size={32} className="text-default-300" />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <label className="cursor-pointer bg-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                        {isUploadingAsset ? t('uploading') : t('changeLogo')}
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          disabled={isUploadingAsset}
                          onChange={(e) =>
                            e.target.files?.[0] &&
                            onUploadAsset('logo', e.target.files[0])
                          }
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <p className="text-sm">{t('bannerImage')}</p>
                <div className="relative group">
                  <div className="relative w-full h-32 bg-default-50 rounded-xl border-2 border-dashed border-default-200 flex flex-col items-center justify-center overflow-hidden">
                    {tenant?.bannerUrl ? (
                      <Image
                        src={tenant.bannerUrl}
                        alt="Banner"
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover"
                      />
                    ) : (
                      <ImageIcon size={32} className="text-default-300" />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <label className="cursor-pointer bg-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                        {isUploadingAsset ? t('uploading') : t('uploadBanner')}
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          disabled={isUploadingAsset}
                          onChange={(e) =>
                            e.target.files?.[0] &&
                            onUploadAsset('banner', e.target.files[0])
                          }
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="border-none bg-white/60 backdrop-blur-md shadow-sm">
        <CardHeader className="flex gap-3">
          <div className="p-2 bg-blue-50 text-[#002e6b] rounded-lg">
            <Store size={20} />
          </div>
          <div className="flex flex-col">
            <p className="text-md font-bold">{t('storeDetails')}</p>
            <p className="text-small text-default-500">
              {t('storeDetailsDesc')}
            </p>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="gap-6 py-6 font-semibold shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <Input
              label={t('shopName')}
              variant="bordered"
              value={shopName}
              onValueChange={setShopName}
            />
            <Select
              label={t('businessCategory')}
              variant="bordered"
              selectedKeys={[shopType]}
              onSelectionChange={(keys) =>
                setShopType(Array.from(keys)[0] as string)
              }
            >
              {SHOP_CATEGORIES.map((cat) => (
                <SelectItem key={cat.id}>{cat.name}</SelectItem>
              ))}
            </Select>
            <Input
              label={t('publicSubdomain')}
              value={tenant?.subdomain || ''}
              variant="flat"
              isReadOnly
              description={
                tenant?.storeUrl && (
                  <a
                    href={tenant.storeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#002e6b] flex items-center gap-1 mt-1 hover:underline"
                  >
                    {t('visitStore')} <ExternalLink size={12} />
                  </a>
                )
              }
            />

            <Input
              label={t('shopDescription')}
              variant="bordered"
              value={shopDescription}
              onValueChange={setShopDescription}
            />

            <Input
              label="ABA PayWay Link URL"
              variant="bordered"
              value={paywayLinkUrl}
              onValueChange={setPaywayLinkUrl}
              placeholder="https://link.payway.com.kh/ABAPAYW..."
            />
          </div>

          <div className="flex justify-stretch mt-2 sm:justify-end">
            <Button
              color="primary"
              className="w-full bg-[#002e6b] sm:w-auto"
              onPress={handleUpdateStore}
              isLoading={isUpdatingStore}
            >
              {t('updateStore')}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
