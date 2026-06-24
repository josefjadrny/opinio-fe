import { formatNumber } from '../../utils/formatNumber';

interface VoteStatProps {
  likes: number;
  dislikes: number;
  // Small uppercase caption under the counts (e.g. "Votes received" / "Votes").
  label: string;
  title?: string;
}

// Right-aligned stacked stat used in the user- and country-detail modal headers:
// ▲ likes  ▼ dislikes over a small uppercase caption.
export function VoteStat({ likes, dislikes, label, title }: VoteStatProps) {
  return (
    <div className="shrink-0 flex flex-col items-end gap-0.5" title={title}>
      <div className="flex items-center gap-2 text-sm tabular-nums leading-none">
        <span className="inline-flex items-baseline gap-1 text-positive font-semibold">
          <span className="text-[11px]">▲</span>
          {formatNumber(likes)}
        </span>
        <span className="inline-flex items-baseline gap-1 text-negative font-semibold">
          <span className="text-[11px]">▼</span>
          {formatNumber(dislikes)}
        </span>
      </div>
      <span className="text-[9px] uppercase tracking-[0.08em] font-semibold text-white/40 leading-none">
        {label}
      </span>
    </div>
  );
}
