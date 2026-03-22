'use client';

import React from 'react';
import { Card, CardBody, CardHeader, Button, Divider, Spinner, Kbd } from '@heroui/react';
import { MessageSquare, Zap, ExternalLink, Copy } from 'lucide-react';
import { CTAButton } from '@/components/ui/cta-button';
import type { TelegramLinkStatus } from '@/lib/auth';

interface TelegramConnectGuideProps {
  status: TelegramLinkStatus | undefined;
  isGenerating: boolean;
  onGenerateCode: () => void;
}

export function TelegramConnectGuide({ 
  status, 
  isGenerating, 
  onGenerateCode 
}: TelegramConnectGuideProps) {
  const activeCode = status?.activeCode;
  const isLinked = status?.linked;

  const handleCopyCode = () => {
    if (activeCode) {
      navigator.clipboard.writeText(`/connect ${activeCode.code}`);
    }
  };

  if (isLinked) {
    return (
      <Card className="shadow-sm border-none bg-success-50/30">
        <CardBody className="p-8 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center">
            <Zap className="text-success w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-success-800">Ready to go!</h3>
            <p className="text-sm text-success-600 mt-1">
              Your store is successfully connected to the Telegram bot.
              You can now manage your orders and products directly from Telegram.
            </p>
          </div>
          <Button 
            as="a" 
            href="https://t.me/EavheangCoolhatBot" 
            target="_blank" 
            color="success" 
            variant="flat"
            endContent={<ExternalLink size={16} />}
            className="mt-2 font-semibold"
          >
            Open Telegram Bot
          </Button>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-none bg-white">
      <CardHeader className="px-6 pt-6">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Zap className="text-primary w-5 h-5" /> Quick Connect Guide
        </h3>
      </CardHeader>
      <CardBody className="px-6 pb-8 flex flex-col gap-8">
        <div className="flex flex-col gap-6 relative">
          <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-default-100 -z-0" />
          
          {/* Step 1 */}
          <div className="flex gap-4 relative z-10">
            <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">1</div>
            <div className="flex flex-col gap-3 grow">
              <div>
                <p className="text-sm font-bold">Generate Link Code</p>
                <p className="text-xs text-default-400">Get a unique code to link your account</p>
              </div>
              <CTAButton 
                size="sm" 
                onPress={onGenerateCode} 
                isLoading={isGenerating}
                className="w-fit h-9"
              >
                {activeCode ? 'Regenerate Code' : 'Generate Code'}
              </CTAButton>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4 relative z-10">
            <div className="w-6 h-6 rounded-full bg-default-200 text-default-600 flex items-center justify-center text-xs font-bold shrink-0">2</div>
            <div className="flex flex-col gap-1 grow">
              <p className="text-sm font-bold">Open Your Telegram Bot</p>
              <p className="text-xs text-default-400">Navigate to our official bot in your Telegram app</p>
              <Button 
                as="a" 
                href="https://t.me/EavheangCoolhatBot" 
                target="_blank" 
                size="sm" 
                variant="light" 
                color="primary"
                endContent={<ExternalLink size={14} />}
                className="w-fit h-8 px-0"
              >
                @EavheangCoolhatBot
              </Button>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4 relative z-10">
            <div className="w-6 h-6 rounded-full bg-default-200 text-default-600 flex items-center justify-center text-xs font-bold shrink-0">3</div>
            <div className="flex flex-col gap-3 grow">
              <div>
                <p className="text-sm font-bold">Paste the command</p>
                <p className="text-xs text-default-400">Send this command to the bot to complete linking</p>
              </div>
              
              {activeCode ? (
                <div 
                  className="flex items-center justify-between p-3 bg-default-50 border border-default-200 rounded-xl group cursor-pointer hover:bg-default-100 transition-colors"
                  onClick={handleCopyCode}
                >
                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] uppercase font-bold text-default-400">Command to send</p>
                    <code className="text-sm font-mono font-bold text-primary">/connect {activeCode.code}</code>
                  </div>
                  <div className="p-2 bg-white rounded-lg shadow-sm group-hover:bg-primary group-hover:text-white transition-colors">
                    <Copy size={14} />
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-default-50 border border-dashed border-default-200 rounded-xl text-center">
                  <p className="text-xs text-default-400 italic">Generate a code first to see the command</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
