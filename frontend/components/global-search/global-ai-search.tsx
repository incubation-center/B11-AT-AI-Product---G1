'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

import { Message } from './types';
import { ChatBubble } from './chat-bubble';
import { TypingIndicator } from './typing-indicator';
import { SearchHeader } from './search-header';
import { SearchInput } from './search-input';
import { EmptyState } from './empty-state';

// ---------------------------------------------------------------------------
// Main component — uses native fetch + ReadableStream for streaming
// ---------------------------------------------------------------------------
export function GlobalAiSearch() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on changes
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, streamingContent, isLoading]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setStreamingContent('');

    try {
      const res = await fetch('/api/global-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error('Failed to reach the AI service.');
      }

      // Read the Vercel AI data stream: each line is `0:"token"\n`
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assembled = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(Boolean);
        for (const line of lines) {
          if (line.startsWith('0:')) {
            try {
              const token = JSON.parse(line.slice(2)) as string;
              assembled += token;
              setStreamingContent(assembled);
            } catch {
              // skip bad parse
            }
          }
        }
      }

      // Commit the finished streaming message
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: 'assistant', content: assembled },
      ]);
    } catch (err) {
      const content =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setMessages((prev) => [
        ...prev,
        { id: `err-${Date.now()}`, role: 'assistant', content },
      ]);
    } finally {
      setIsLoading(false);
      setStreamingContent('');
    }
  };

  const isEmpty = messages.length === 0 && !isLoading;

  return (
    <div className="flex h-screen flex-col bg-[#0d0d0d] text-white">
      <SearchHeader />

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        <AnimatePresence mode="wait">
          {isEmpty ? (
            <EmptyState onSuggestionClick={(s) => void sendMessage(s)} />
          ) : (
            <motion.div
              key="messages"
              className="mx-auto flex max-w-2xl flex-col gap-5"
            >
              {messages.map((m) => (
                <ChatBubble key={m.id} role={m.role} content={m.content} />
              ))}

              {/* Live streaming bubble */}
              {isLoading && streamingContent && (
                <ChatBubble role="assistant" content={streamingContent} />
              )}
              {isLoading && !streamingContent && <TypingIndicator />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <SearchInput
        input={input}
        setInput={setInput}
        isLoading={isLoading}
        onSubmit={(text) => void sendMessage(text)}
      />
    </div>
  );
}
