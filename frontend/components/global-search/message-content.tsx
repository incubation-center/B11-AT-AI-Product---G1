import { ExternalLink } from 'lucide-react';

export function MessageContent({ content }: { content: string }) {
  const parts = content.split(/(\[.*?\]\(.*?\)|\*\*.*?\*\*)/g);
  return (
    <span className="whitespace-pre-wrap leading-7">
      {parts.map((part, i) => {
        const linkMatch = /^\[(.+?)\]\((.+?)\)$/.exec(part);
        if (linkMatch) {
          return (
            <a
              key={i}
              href={linkMatch[2]}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 text-[#ffbd59] underline-offset-2 hover:bg-white/20 hover:underline"
            >
              {linkMatch[1]}
              <ExternalLink size={11} />
            </a>
          );
        }
        const boldMatch = /^\*\*(.+?)\*\*$/.exec(part);
        if (boldMatch) {
          return <strong key={i}>{boldMatch[1]}</strong>;
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}
