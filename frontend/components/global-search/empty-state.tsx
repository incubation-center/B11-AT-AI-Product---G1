import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const SUGGESTIONS = [
  'I need a gift under $30 for my mom',
  'Show me handmade Cambodian crafts',
  'Looking for skincare for sensitive skin',
  'What stores sell fashion accessories?',
];

export function EmptyState({ onSuggestionClick }: { onSuggestionClick: (text: string) => void }) {
  return (
    <motion.div
      key="empty"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex h-full flex-col items-center justify-center gap-8 pb-8 text-center"
    >
      <div className="space-y-3">
        <div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ring-1 ring-white/12"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          <Sparkles size={28} className="text-[#ffbd59]" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Ask Coolhat</h1>
        <p className="max-w-xs text-sm leading-6 text-white/50">
          Describe what you&apos;re looking for and I&apos;ll find the best products from
          our SME stores.
        </p>
      </div>

      <div className="flex max-w-lg flex-wrap justify-center gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onSuggestionClick(s)}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70 transition hover:border-white/25 hover:bg-white/10 hover:text-white"
          >
            {s}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
