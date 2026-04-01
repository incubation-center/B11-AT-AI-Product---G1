import { ArrowUp } from 'lucide-react';
import { useRef } from 'react';

type SearchInputProps = {
  input: string;
  setInput: (val: string) => void;
  isLoading: boolean;
  onSubmit: (text: string) => void;
};

export function SearchInput({ input, setInput, isLoading, onSubmit }: SearchInputProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit(input);
    }
  };

  return (
    <div className="border-t border-white/8 bg-[#0d0d0d] px-4 pb-6 pt-4 sm:px-8">
      <form
        onSubmit={handleSubmit}
        className="mx-auto flex max-w-2xl items-end gap-3 rounded-2xl border border-white/12 px-4 py-3 shadow-[0_0_40px_rgba(0,0,0,0.4)] ring-1 ring-inset ring-white/5 focus-within:border-white/20"
        style={{ background: 'rgba(255,255,255,0.05)' }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about products…"
          rows={1}
          className="flex-1 resize-none bg-transparent text-sm leading-6 text-white placeholder:text-white/30 focus:outline-none"
          style={{ maxHeight: '160px' }}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = 'auto';
            el.style.height = `${el.scrollHeight}px`;
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#c61c2f] text-white transition hover:bg-[#a51626] disabled:opacity-30"
        >
          <ArrowUp size={16} />
        </button>
      </form>
      <p className="mt-2 text-center text-[11px] text-white/25">
        Coolhat only suggests products from registered SME stores
      </p>
    </div>
  );
}
