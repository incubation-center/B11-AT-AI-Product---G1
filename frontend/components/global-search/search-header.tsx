import { Sparkles } from 'lucide-react';

export function SearchHeader() {
  return (
    <header className="flex items-center justify-between border-b border-white/8 px-6 py-4">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#c61c2f]">
          <Sparkles size={14} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-none text-white">Ask Coolhat</p>
          <p className="mt-0.5 text-[11px] text-white/40">AI-powered product discovery</p>
        </div>
      </div>
      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/50">
        Shopping Assistant only
      </span>
    </header>
  );
}
