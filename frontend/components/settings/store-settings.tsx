'use client';

import React, { useState } from 'react';
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
import { Store, Palette, Image as ImageIcon, CheckCircle2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TenantSummary } from '@/lib/auth';
import Image from 'next/image';

const STOREFRONT_TEMPLATES = [
  { id: 'boutique-editorial', name: 'Boutique Editorial', description: 'Large imagery and elegant typography for high-end feel.' },
  { id: 'market-grid', name: 'Market Grid', description: 'Functional grid layout optimized for discovery and speed.' },
  { id: 'catalog-flow', name: 'Catalog Flow', description: 'Structured categorization for large product inventories.' },
];

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
  onUpdateStore: (payload: Record<string, unknown>) => void;
  isUpdatingStore: boolean;
  onUploadAsset: (type: 'logo' | 'banner', file: File) => void;
  isUploadingAsset: boolean;
}

export function StoreSettings({
  tenant,
  onUpdateStore,
  isUpdatingStore,
  onUploadAsset,
  isUploadingAsset
}: StoreSettingsProps) {
  const [shopName, setShopName] = useState(tenant?.shopName || '');
  const [shopDescription, setShopDescription] = useState(tenant?.description || '');
  const [shopType, setShopType] = useState(tenant?.shopType || '');
  const [selectedTemplate, setSelectedTemplate] = useState(tenant?.storefrontTemplate || 'market-grid');

  const handleUpdateStore = () => {
    onUpdateStore({
      shop_name: shopName,
      description: shopDescription,
      shop_type: shopType,
      storefront_template: selectedTemplate,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <Card className="border-none bg-white/60 backdrop-blur-md shadow-sm">
        <CardHeader className="flex gap-3">
          <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
            <Palette size={20} />
          </div>
          <div className="flex flex-col">
            <p className="text-md font-bold">Branding & Theme</p>
            <p className="text-small text-default-500">Customize how your store looks to buyers.</p>
          </div>
        </CardHeader>
        <Divider/>
        <CardBody className="gap-8 py-6 font-semibold shadow-sm">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <p className="text-sm">Storefront Theme</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {STOREFRONT_TEMPLATES.map((tmpl) => (
                  <div 
                    key={tmpl.id}
                    onClick={() => setSelectedTemplate(tmpl.id)}
                    className={cn(
                      "group relative p-4 rounded-xl border-2 transition-all cursor-pointer",
                      selectedTemplate === tmpl.id 
                        ? "border-[#002e6b] bg-blue-50/30" 
                        : "border-default-100 hover:border-default-300"
                    )}
                  >
                    {selectedTemplate === tmpl.id && (
                      <div className="absolute top-2 right-2 text-[#002e6b]">
                        <CheckCircle2 size={16} />
                      </div>
                    )}
                    <p className="font-bold text-sm mb-1">{tmpl.name}</p>
                    <p className="text-xs text-default-500">{tmpl.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
              <div className="flex flex-col gap-3">
                <p className="text-sm">Store Logo</p>
                <div className="relative group">
                  <div className="w-full h-32 bg-default-50 rounded-xl border-2 border-dashed border-default-200 flex flex-col items-center justify-center overflow-hidden">
                    {tenant?.logoUrl ? (
                      <Image src={tenant.logoUrl} className="w-full h-full object-contain p-2" alt="Logo" />
                    ) : (
                      <ImageIcon size={32} className="text-default-300" />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <label className="cursor-pointer bg-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                        {isUploadingAsset ? 'Uploading...' : 'Change Logo'}
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          disabled={isUploadingAsset}
                          onChange={(e) => e.target.files?.[0] && onUploadAsset('logo', e.target.files[0])}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <p className="text-sm">Banner Image</p>
                <div className="relative group">
                  <div className="w-full h-32 bg-default-50 rounded-xl border-2 border-dashed border-default-200 flex flex-col items-center justify-center overflow-hidden">
                  {tenant?.bannerUrl ? (
                      <Image src={tenant.bannerUrl} className="w-full h-full object-cover" alt="Banner" />
                    ) : (
                      <ImageIcon size={32} className="text-default-300" />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <label className="cursor-pointer bg-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                        {isUploadingAsset ? 'Uploading...' : 'Upload Banner'}
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          disabled={isUploadingAsset}
                          onChange={(e) => e.target.files?.[0] && onUploadAsset('banner', e.target.files[0])}
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
            <p className="text-md font-bold">Store Details</p>
            <p className="text-small text-default-500">Manage your business profile and location.</p>
          </div>
        </CardHeader>
        <Divider/>
        <CardBody className="gap-6 py-6 font-semibold shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <Input
              label="Shop Name"
              variant="bordered"
              value={shopName}
              onValueChange={setShopName}
            />
            <Select
              label="Business Category"
              variant="bordered"
              selectedKeys={[shopType]}
              onSelectionChange={(keys) => setShopType(Array.from(keys)[0] as string)}
            >
              {SHOP_CATEGORIES.map((cat) => (
                <SelectItem key={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </Select>
            <Input
              label="Public Subdomain"
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
                    Visit Store <ExternalLink size={12} />
                  </a>
                )
              }
            />
            <Input
              label="Shop Description"
              variant="bordered"
              value={shopDescription}
              onValueChange={setShopDescription}
            />
          </div>
          <div className="flex justify-end mt-2">
            <Button 
              color="primary" 
              className="bg-[#002e6b]"
              onPress={handleUpdateStore}
              isLoading={isUpdatingStore}
            >
              Update Store
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
