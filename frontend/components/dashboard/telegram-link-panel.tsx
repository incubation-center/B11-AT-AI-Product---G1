'use client';

import { CTAButton } from '@/components/ui/cta-button';
import {
  useTelegramLinkStatus,
  useGenerateTelegramCode,
} from '@/hooks/use-telegram-queries';

export function TelegramLinkPanel() {
  const {
    data: status,
    isLoading: statusLoading,
    error: statusError,
    refetch,
  } = useTelegramLinkStatus();
  const generateCodeMutation = useGenerateTelegramCode();

  const error = statusError || generateCodeMutation.error;
  const isPending = statusLoading || generateCodeMutation.isPending;

  function refreshStatus() {
    refetch();
  }

  function generateCode() {
    generateCodeMutation.mutate(undefined);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c61c2f]">
          Telegram status
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <Stat label="Has tenant" value={status?.hasTenant ? 'Yes' : 'No'} />
          <Stat
            label="Linked"
            value={status?.linked ? 'Connected' : 'Not linked'}
          />
          <Stat
            label="Telegram user"
            value={status?.telegramUserId ? String(status.telegramUserId) : '-'}
          />
        </div>

        <div className="mt-6 rounded-[24px] bg-slate-50 p-5">
          <p className="text-sm font-semibold text-[#002e6b]">
            {status?.activeCode
              ? `Current connect code: ${status.activeCode.code}`
              : 'No active connect code yet'}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Ask the owner to send <code>/connect CODE</code> to the Telegram
            bot. After that, the backend links the Telegram account to the
            tenant.
          </p>
          {status?.activeCode ? (
            <p className="mt-3 text-xs text-slate-500">
              Expires at:{' '}
              {new Date(status.activeCode.expiresAt).toLocaleString()}
            </p>
          ) : null}
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error instanceof Error ? error.message : String(error)}
          </div>
        ) : null}
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c61c2f]">
          Actions
        </p>
        <div className="mt-5 space-y-3">
          <CTAButton
            type="button"
            onPress={generateCode}
            isLoading={isPending}
            className="w-full text-sm"
          >
            Generate connect code
          </CTAButton>
          <CTAButton
            type="button"
            tone="secondary"
            variant="bordered"
            onPress={refreshStatus}
            isLoading={isPending}
            className="w-full text-sm"
          >
            Refresh Telegram status
          </CTAButton>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-slate-50 px-4 py-4">
      <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
