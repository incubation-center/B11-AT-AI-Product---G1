'use client';

import React from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Chip,
  Button,
  Divider,
} from '@heroui/react';
import { Send, CheckCircle2, XCircle, RefreshCw, User } from 'lucide-react';
import type { TelegramLinkStatus } from '@/lib/auth';

interface TelegramStatusCardProps {
  status: TelegramLinkStatus | undefined;
  isLoading: boolean;
  onRefresh: () => void;
}

export function TelegramStatusCard({
  status,
  isLoading,
  onRefresh,
}: TelegramStatusCardProps) {
  const isLinked = status?.linked;

  return (
    <Card className="shadow-sm border-none bg-default-50/50">
      <CardHeader className="flex justify-between items-center px-6 pt-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Send className="text-primary w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Telegram Status</h3>
            <p className="text-sm text-default-400">Current connection state</p>
          </div>
        </div>
        <Button
          isIconOnly
          variant="flat"
          size="sm"
          onPress={onRefresh}
          isLoading={isLoading}
        >
          <RefreshCw size={16} />
        </Button>
      </CardHeader>
      <CardBody className="px-6 py-6 flex flex-col gap-6">
        <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-default-100 shadow-sm">
          <div className="flex items-center gap-3">
            {isLinked ? (
              <CheckCircle2 className="text-success w-6 h-6" />
            ) : (
              <XCircle className="text-danger w-6 h-6" />
            )}
            <div>
              <p className="text-sm font-semibold">
                {isLinked ? 'Connected' : 'Not Linked'}
              </p>
              <p className="text-xs text-default-400">
                {isLinked
                  ? 'Your store is linked to a Telegram bot'
                  : 'No Telegram account linked yet'}
              </p>
            </div>
          </div>
          <Chip
            color={isLinked ? 'success' : 'danger'}
            variant="flat"
            size="sm"
            className="capitalize"
          >
            {isLinked ? 'Active' : 'Inactive'}
          </Chip>
        </div>

        {isLinked && (
          <div className="space-y-4">
            <Divider />
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-white rounded-xl border border-default-100">
                <p className="text-[10px] uppercase font-bold text-default-400 mb-1">
                  Telegram User ID
                </p>
                <div className="flex items-center gap-2">
                  <User size={14} className="text-primary" />
                  <span className="text-sm font-semibold">
                    {status?.telegramUserId || 'N/A'}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-white rounded-xl border border-default-100">
                <p className="text-[10px] uppercase font-bold text-default-400 mb-1">
                  Linked Store
                </p>
                <p className="text-sm font-semibold truncate">
                  {status?.tenant?.shopName || 'Unknown'}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
