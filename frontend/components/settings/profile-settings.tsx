'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Card,
  CardHeader,
  CardBody,
  Input,
  Button,
  Divider,
  Avatar,
} from '@heroui/react';
import {
  User,
  Mail,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Lock,
  Languages,
} from 'lucide-react';
import { LanguageSwitcher } from '@/components/i18n/language-switcher';
import { UserProfile } from '@/lib/profile';

interface ProfileSettingsProps {
  profile: UserProfile | undefined;
  onUpdateName: (name: string) => void;
  isUpdatingName: boolean;
  onSendVerification: () => void;
  isSendingVerification: boolean;
  onRequestPasswordReset: (email: string) => void;
  isRequestingReset: boolean;
}

export function ProfileSettings({
  profile,
  onUpdateName,
  isUpdatingName,
  onSendVerification,
  isSendingVerification,
  onRequestPasswordReset,
  isRequestingReset,
}: ProfileSettingsProps) {
  const t = useTranslations('settings.profile');
  const [fullName, setFullName] = useState(profile?.profile?.fullName || '');

  return (
    <div className="flex flex-col gap-6">
      <Card className="border-none bg-white/60 backdrop-blur-md shadow-sm">
        <CardHeader className="flex gap-3">
          <div className="p-2 bg-blue-50 text-[#002e6b] rounded-lg">
            <User size={20} />
          </div>
          <div className="flex flex-col">
            <p className="text-md font-bold">{t('personalInfo')}</p>
            <p className="text-small text-default-500">
              {t('personalInfoDesc')}
            </p>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="gap-6 py-6 font-semibold shadow-sm">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <Avatar
              src={
                profile?.email
                  ? `https://avatar.vercel.sh/${profile.email}`
                  : ''
              }
              className="w-20 h-20 text-large border-2 border-white shadow-md"
            />
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              <Input
                label={t('fullName')}
                placeholder={t('fullNamePlaceholder')}
                variant="bordered"
                value={fullName}
                onValueChange={setFullName}
              />
              <Input
                label={t('emailAddress')}
                value={profile?.email || ''}
                variant="flat"
                isReadOnly
                endContent={<Mail className="text-default-400" size={18} />}
              />
            </div>
          </div>
          <div className="flex justify-stretch gap-3 mt-2 sm:justify-end">
            <Button
              color="primary"
              className="w-full bg-[#002e6b] sm:w-auto"
              onPress={() => onUpdateName(fullName)}
              isLoading={isUpdatingName}
            >
              {t('saveName')}
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card className="border-none bg-white/60 backdrop-blur-md shadow-sm">
        <CardHeader className="flex gap-3">
          <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
            <ShieldAlert size={20} />
          </div>
          <div className="flex flex-col">
            <p className="text-md font-bold">{t('accountSecurity')}</p>
            <p className="text-small text-default-500">
              {t('accountSecurityDesc')}
            </p>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="gap-6 py-6 font-semibold shadow-sm">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3 p-4 bg-default-50 rounded-xl border border-default-100 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={
                    profile?.emailVerified ? 'text-success' : 'text-warning'
                  }
                >
                  {profile?.emailVerified ? (
                    <CheckCircle2 size={20} />
                  ) : (
                    <AlertCircle size={20} />
                  )}
                </div>
                <div>
                  <p className="text-sm">{t('emailVerification')}</p>
                  <p className="text-xs text-default-500">
                    {profile?.emailVerified
                      ? t('emailVerified')
                      : t('emailNotVerified')}
                  </p>
                </div>
              </div>
              {!profile?.emailVerified && (
                <Button
                  size="sm"
                  variant="flat"
                  color="warning"
                  className="w-full sm:w-auto"
                  onPress={onSendVerification}
                  isLoading={isSendingVerification}
                >
                  {t('sendLink')}
                </Button>
              )}
            </div>

            <div className="flex flex-col gap-3 p-4 bg-default-50 rounded-xl border border-default-100 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="text-primary">
                  <Lock size={20} />
                </div>
                <div>
                  <p className="text-sm">{t('passwordReset')}</p>
                  <p className="text-xs text-default-500">
                    {t('passwordResetDesc')}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="flat"
                color="primary"
                className="w-full sm:w-auto"
                onPress={() =>
                  profile?.email && onRequestPasswordReset(profile.email)
                }
                isLoading={isRequestingReset}
              >
                {t('requestReset')}
              </Button>
            </div>

            <div className="flex flex-col gap-3 p-4 bg-default-50 rounded-xl border border-default-100 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="text-primary">
                  <Languages size={20} />
                </div>
                <div>
                  <p className="text-sm">{t('languagePreference')}</p>
                  <p className="text-xs text-default-500">
                    {t('languagePreferenceDesc')}
                  </p>
                </div>
              </div>
              <LanguageSwitcher
                showLabel={false}
                className="w-full sm:w-auto"
                selectClassName="w-full sm:w-auto"
              />
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
