'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { StorefrontStore } from '@/lib/storefront';

type StorefrontAssistantProps = {
  store: StorefrontStore;
};

type ChatMessage = {
  id: string;
  role: 'assistant' | 'user';
  content: string;
};

type AskAssistantResponse = {
  session_id: string;
  answer: string;
};

const STORAGE_KEY_PREFIX = 'coolhat.storefront.assistant';

export function StorefrontAssistant({ store }: StorefrontAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [input, setInput] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Ask me anything about ${store.shopName}'s products, prices, stock, or variants.`,
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(
      `${STORAGE_KEY_PREFIX}.${store.subdomain}`,
    );
    if (stored) {
      setSessionId(stored);
    }
  }, [store.subdomain]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isOpen]);

  const submitQuestion = async () => {
    const question = input.trim();
    if (!question || isPending) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: question,
    };

    setMessages((current) => [...current, userMessage]);
    setInput('');
    setError('');
    setIsPending(true);

    try {
      const response = await fetch('/api/storefront/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subdomain: store.subdomain,
          question,
          session_id: sessionId || undefined,
          anonymous_id: `web-${store.subdomain}`,
        }),
      });

      const data = (await response.json()) as {
        message?: string;
      } & Partial<AskAssistantResponse>;
      if (!response.ok || !data.answer || !data.session_id) {
        throw new Error(data.message ?? 'Unable to ask assistant');
      }

      setSessionId(data.session_id);
      window.localStorage.setItem(
        `${STORAGE_KEY_PREFIX}.${store.subdomain}`,
        data.session_id,
      );
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.answer,
        },
      ]);
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : 'Unable to ask assistant';
      setError(message);
      setMessages((current) =>
        current.filter((messageItem) => messageItem.id !== userMessage.id),
      );
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-5 right-5 z-50">
        <Button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className="h-12 rounded-full bg-[#002e6b] px-5 text-sm font-semibold text-white shadow-[0_20px_50px_rgba(0,46,107,0.28)] hover:bg-[#003d8f]"
        >
          {isOpen ? (
            <X className="size-4" />
          ) : (
            <MessageCircle className="size-4" />
          )}
          {isOpen ? 'Close Assistant' : 'Ask This Store'}
        </Button>
      </div>

      {isOpen ? (
        <div className="fixed bottom-20 right-5 z-50 h-[min(72vh,640px)] w-[min(calc(100vw-2rem),390px)] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.18)]">
          <div className="border-b border-slate-200 bg-[#002e6b] px-5 py-4 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
              Store Assistant
            </p>
            <h2 className="mt-1 text-lg font-semibold">{store.shopName}</h2>
            <p className="mt-1 text-sm text-white/75">
              Ask about products, pricing, stock, and variants.
            </p>
          </div>

          <div
            ref={scrollRef}
            className="flex h-[calc(100%-154px)] flex-col gap-3 overflow-y-auto bg-slate-50 px-4 py-4"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                  message.role === 'user'
                    ? 'ml-auto bg-[#002e6b] text-white'
                    : 'bg-white text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.08)]'
                }`}
              >
                {message.content}
              </div>
            ))}

            {isPending ? (
              <div className="max-w-[85%] rounded-2xl bg-white px-4 py-3 text-sm text-slate-500 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
                Thinking...
              </div>
            ) : null}
          </div>

          <div className="border-t border-slate-200 bg-white px-4 py-4">
            {error ? (
              <p className="mb-2 text-sm text-rose-600">{error}</p>
            ) : null}
            <div className="flex items-end gap-2 rounded-3xl border border-slate-200 bg-slate-50 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void submitQuestion();
                  }
                }}
                placeholder="Ask about this store..."
                className="min-h-[56px] flex-1 resize-none border-0 bg-transparent px-3 py-2 text-sm leading-6 text-slate-900 caret-[#002e6b] outline-none placeholder:text-slate-400 focus:outline-none"
              />
              <Button
                type="button"
                onClick={() => void submitQuestion()}
                disabled={isPending || !input.trim()}
                className="size-12 rounded-2xl bg-[#002e6b] p-0 text-white hover:bg-[#003d8f]"
              >
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
