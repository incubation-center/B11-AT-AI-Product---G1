import { Bot } from 'lucide-react';
import { motion } from 'framer-motion';

export function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white">
        <Bot size={14} />
      </div>
      <div
        className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm px-4 py-3 ring-1 ring-white/10"
        style={{ background: 'rgba(255,255,255,0.08)' }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-white/50"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 1, delay: i * 0.18 }}
          />
        ))}
      </div>
    </div>
  );
}
