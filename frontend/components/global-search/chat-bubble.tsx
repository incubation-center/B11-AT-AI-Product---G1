import { Bot, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { MessageContent } from './message-content';

export function ChatBubble({
  role,
  content,
}: {
  role: 'user' | 'assistant';
  content: string;
}) {
  const isUser = role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
          isUser ? 'bg-[#ffbd59] text-slate-900' : 'bg-white/10 text-white'
        }`}
      >
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
          isUser
            ? 'rounded-tr-sm bg-[#ffbd59] text-slate-900'
            : 'rounded-tl-sm text-slate-100 ring-1 ring-white/10'
        }`}
        style={!isUser ? { background: 'rgba(255,255,255,0.08)' } : undefined}
      >
        <MessageContent content={content} />
      </div>
    </motion.div>
  );
}
