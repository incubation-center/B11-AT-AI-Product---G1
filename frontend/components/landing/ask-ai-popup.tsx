'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, Sparkles, X, ArrowRight } from 'lucide-react';

const QUICK_PROMPTS = [
  'Find me gift ideas under $30',
  'Show skincare for sensitive skin',
  'What are trending fashion items?',
];

export function AskAiPopup() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-auto fixed inset-0 bg-black/35"
              onClick={() => setOpen(false)}
            />

            <motion.div
              ref={panelRef}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="pointer-events-auto relative w-[min(92vw,24rem)] overflow-hidden rounded-3xl border border-red-200/70 bg-white shadow-[0_18px_45px_rgba(127,29,29,0.28)]"
            >
              <div className="relative overflow-hidden bg-gradient-to-r from-red-600 to-red-800 px-5 py-4 text-white">
                <motion.div
                  className="absolute inset-y-0 w-16 -translate-x-20 rotate-12 bg-white/25 blur-sm"
                  animate={{ x: [0, 420] }}
                  transition={{ repeat: Infinity, duration: 2.8, ease: 'linear' }}
                />
                <div className="relative flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-red-100">Instant Assistant</p>
                    <h3 className="mt-1 text-lg font-semibold">Ask Coolhat AI</h3>
                    <p className="mt-1 text-xs text-red-100">Get recommendations in seconds.</p>
                  </div>
                  <button
                    type="button"
                    aria-label="Close popup"
                    onClick={() => setOpen(false)}
                    className="rounded-full bg-white/20 p-1.5 text-white transition hover:bg-white/30"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-3 bg-gradient-to-b from-red-50 to-white px-5 py-4">
                <p className="text-sm text-slate-700">Try one prompt:</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_PROMPTS.map((prompt) => (
                    <span
                      key={prompt}
                      className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700"
                    >
                      {prompt}
                    </span>
                  ))}
                </div>

                <Link
                  href="/chat"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:from-red-700 hover:to-red-800"
                >
                  Open Full AI Chat
                  <ArrowRight size={15} />
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="pointer-events-auto flex items-center gap-3">
        {!open && (
          <motion.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="pointer-events-auto relative rounded-2xl border border-[#1f315f] bg-[#0d1731] px-4 py-3 text-left text-white shadow-[0_16px_30px_rgba(2,6,23,0.45)]"
          >
            <span className="absolute -right-1 top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 border-r border-b border-[#1f315f] bg-[#0d1731]" />
            <p className="flex items-center gap-2 text-sm leading-none">
              <Sparkles size={14} className="text-[#ffd250]" />
              <span className="text-base font-semibold">Ask Coolhat AI</span>
            </p>
            <p className="mt-1 text-[13px] font-medium text-white/90">Get instant answers!</p>
            <p className="mt-1 flex items-center gap-1.5 text-[12px] text-[#8ef2a4]">
              <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
              Online - 24/7
            </p>
          </motion.div>
        )}

        <div className="relative">
        {!open && (
          <>
            <motion.span
              className="absolute -inset-5 rounded-full bg-red-400/25"
              animate={{ scale: [0.95, 1.08, 0.95], opacity: [0.35, 0.52, 0.35] }}
              transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
            />
            <motion.span
              className="absolute inset-0 rounded-full border border-red-500/70"
              animate={{ scale: [1, 1.65], opacity: [0.9, 0] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: 'easeOut' }}
            />
            <motion.span
              className="absolute inset-0 rounded-full border border-red-300/80"
              animate={{ scale: [1, 1.95], opacity: [0.75, 0] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: 'easeOut', delay: 0.35 }}
            />
          </>
        )}

        <motion.button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          animate={open ? {} : { y: [0, -7, 0] }}
          transition={open ? {} : { repeat: Infinity, duration: 1.9, ease: 'easeInOut' }}
          className="group relative inline-flex h-[70px] w-[70px] items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-red-600 via-red-700 to-red-800 text-white shadow-[0_16px_35px_rgba(127,29,29,0.62)]"
          aria-label="Toggle Ask Coolhat AI"
        >
          <span className="absolute inset-[5px] rounded-full border border-white/30" />

          <motion.span
            className="absolute inset-y-0 w-7 -translate-x-14 rotate-12 bg-white/30 blur-sm"
            animate={{ x: [0, 140] }}
            transition={{ repeat: Infinity, duration: 2.7, ease: 'linear' }}
          />

          <motion.div
            animate={open ? { rotate: 90 } : { rotate: [0, 14, -10, 0] }}
            transition={open ? { duration: 0.2 } : { repeat: Infinity, duration: 2.8, ease: 'easeInOut' }}
          >
            {open ? <X size={24} /> : <Sparkles size={24} />}
          </motion.div>

          <motion.span
            animate={{ rotate: [0, 12, -8, 0] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
            className="absolute -right-1 -top-1 inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow"
          >
            <MessageCircle size={11} />
          </motion.span>
        </motion.button>
        </div>
      </div>
    </div>
  );
}
