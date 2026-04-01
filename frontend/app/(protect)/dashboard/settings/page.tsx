'use client';

import React from 'react';
import { 
  Tabs, 
  Tab,
} from '@heroui/react';
import { 
  User, 
  Store, 
  ShieldAlert, 
} from 'lucide-react';
import { useProfile, useUpdateProfile, useSendVerificationEmail, useRequestPasswordReset, useDeactivateAccount } from '@/hooks/use-profile-queries';
import { useTenantStatus, useUpdateTenant, useDeactivateTenant, useUploadTenantAsset } from '@/hooks/use-tenant-queries';
import { ProfileSettings } from '@/components/settings/profile-settings';
import { StoreSettings } from '@/components/settings/store-settings';
import { DangerZone } from '@/components/settings/danger-zone';

export default function SettingsPage() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: tenantData, isLoading: tenantLoading } = useTenantStatus();
  
  const updateProfileMutation = useUpdateProfile();
  const sendVerificationMutation = useSendVerificationEmail();
  const resetPasswordMutation = useRequestPasswordReset();
  const deactivateAccountMutation = useDeactivateAccount();
  
  const updateTenantMutation = useUpdateTenant();
  const deactivateTenantMutation = useDeactivateTenant();
  const uploadAssetMutation = useUploadTenantAsset();

  const handleAssetUpload = async (type: 'logo' | 'banner', file: File) => {
    const result = await uploadAssetMutation.mutateAsync({ type, file });
    if (result.upload?.publicUrl) {
      updateTenantMutation.mutate(
        type === 'logo'
          ? { logo_url: result.upload.publicUrl }
          : { banner_url: result.upload.publicUrl }
      );
    }
  };

  const isLoading = profileLoading || tenantLoading;

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center animate-pulse">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-default-200" />
          <div className="h-4 w-32 bg-default-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-[#002e6b]">Settings</h1>
        <p className="text-default-500 font-medium">Manage your profile, store details, and account security.</p>
      </div>

      <Tabs 
        aria-label="Settings sections" 
        variant="underlined"
        classNames={{
          tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
          cursor: "w-full bg-[#002e6b]",
          tab: "max-w-fit px-0 h-12",
          tabContent: "group-data-[selected=true]:text-[#002e6b] font-semibold"
        }}
      >
        <Tab
          key="profile"
          title={
            <div className="flex items-center space-x-2">
              <User size={18} />
              <span>Profile & Account</span>
            </div>
          }
        >
          <div className="mt-6">
            <ProfileSettings 
              key={profile?.id}
              profile={profile}
              onUpdateName={(name) => updateProfileMutation.mutate(name)}
              isUpdatingName={updateProfileMutation.isPending}
              onSendVerification={() => sendVerificationMutation.mutate()}
              isSendingVerification={sendVerificationMutation.isPending}
              onRequestPasswordReset={(email) => resetPasswordMutation.mutate(email)}
              isRequestingReset={resetPasswordMutation.isPending}
            />
          </div>
        </Tab>

        <Tab
          key="store"
          title={
            <div className="flex items-center space-x-2">
              <Store size={18} />
              <span>Store Management</span>
            </div>
          }
        >
          <div className="mt-6">
            <StoreSettings 
              key={`${tenantData?.tenant?.id ?? 'no-tenant'}:${tenantData?.tenant?.storefrontTemplate ?? 'no-template'}:${tenantData?.tenant?.shopName ?? ''}:${tenantData?.tenant?.shopType ?? ''}`}
              tenant={tenantData?.tenant || null}
              onUpdateStore={(payload) => updateTenantMutation.mutateAsync(payload)}
              isUpdatingStore={updateTenantMutation.isPending}
              onUploadAsset={handleAssetUpload}
              isUploadingAsset={uploadAssetMutation.isPending}
            />
          </div>
        </Tab>

        <Tab
          key="danger"
          title={
            <div className="flex items-center space-x-2 text-danger">
              <ShieldAlert size={18} />
              <span>Danger Zone</span>
            </div>
          }
        >
          <div className="mt-6">
            <DangerZone 
              onDeactivateStore={() => deactivateTenantMutation.mutate()}
              isDeactivatingStore={deactivateTenantMutation.isPending}
              onDeactivateAccount={() => deactivateAccountMutation.mutate()}
              isDeactivatingAccount={deactivateAccountMutation.isPending}
            />
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}
