'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Spinner } from '@heroui/react';

import { cn } from '@/lib/utils';

type GlobalLoadingSplashProps = {
  busy: boolean;
  pendingCount: number;
};

const SHOW_DELAY_MS = 140;
const MIN_VISIBLE_MS = 380;

export function GlobalLoadingSplash({
  busy,
  pendingCount,
}: GlobalLoadingSplashProps) {
  const [visible, setVisible] = useState(false);
  const visibleSinceRef = useRef<number | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    if (busy) {
      if (!visible) {
        timer = setTimeout(() => {
          visibleSinceRef.current = Date.now();
          setVisible(true);
        }, SHOW_DELAY_MS);
      }
      return () => {
        if (timer) clearTimeout(timer);
      };
    }

    if (!visible) {
      return () => {
        if (timer) clearTimeout(timer);
      };
    }

    const elapsed = visibleSinceRef.current
      ? Date.now() - visibleSinceRef.current
      : 0;
    const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);

    timer = setTimeout(() => {
      visibleSinceRef.current = null;
      setVisible(false);
    }, remaining);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [busy, visible]);

  useEffect(() => {
    if (!visible) {
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('cursor');
      return;
    }

    document.body.style.overflow = 'hidden';
    document.body.style.cursor = 'progress';

    return () => {
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('cursor');
    };
  }, [visible]);

  const label = useMemo(() => {
    if (pendingCount <= 1) {
      return 'Syncing your storefront state';
    }

    return `Processing ${pendingCount} background requests`;
  }, [pendingCount]);

  return (
    <div
      aria-hidden={!visible}
      aria-live="polite"
      className={cn(
        'fixed inset-0 z-[140] transition-opacity duration-300',
        visible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_10%_-10%,rgba(0,46,107,0.26),transparent_55%),radial-gradient(800px_420px_at_90%_100%,rgba(198,28,47,0.18),transparent_60%),linear-gradient(145deg,#071a36,#0a2450_45%,#0d2e63)]" />
      <div className="absolute inset-0 bg-[linear-gradient(transparent_96%,rgba(255,255,255,0.06)_100%)] bg-[length:100%_16px]" />

      <div className="relative flex h-full items-center justify-center p-6">
        <div className="w-full max-w-md rounded-[28px] border border-white/20 bg-white/10 p-7 text-white shadow-[0_26px_80px_rgba(0,0,0,0.4)] backdrop-blur-xl">
          <div className="mb-5 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-white/75">
              Coolhat Processing
            </p>
            <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/80">
              Please wait
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute -inset-2 animate-pulse rounded-full border border-cyan-200/45" />
              <div className="relative rounded-full border border-white/30 bg-[#0a2f66] p-2.5">
                <Spinner color="primary" size="lg" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight [font-family:'Trebuchet_MS','Segoe_UI',sans-serif]">
                Updating Experience
              </h2>
              <p className="mt-1 text-sm text-white/80">{label}</p>
            </div>
          </div>

          <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-white/20">
            <div className="h-full w-1/2 animate-splash-slide rounded-full bg-[linear-gradient(90deg,#60a5fa,#fbbf24,#f87171)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
