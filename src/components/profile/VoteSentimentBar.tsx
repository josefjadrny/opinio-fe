import { formatNumber } from '../../utils/formatNumber';

interface VoteSentimentBarProps {
  label?: string;
  likes: number;
  dislikes: number;
  /** All-time totals — shown in muted brackets next to the live counts. */
  totalLikes?: number;
  totalDislikes?: number;
  /** Muted = a secondary bar: thinner + dimmer than the primary one. */
  muted?: boolean;
}

// Horizontal likes-vs-dislikes proportion bar. The green segment's width is
// likes' share of the total; red fills the remainder, so the split point reads
// as the sentiment at a glance. Counts sit at each end. With no votes the track
// is a neutral grey with no fill.
export function VoteSentimentBar({ label, likes, dislikes, totalLikes, totalDislikes, muted = false }: VoteSentimentBarProps) {
  const total = likes + dislikes;
  const likePct = total > 0 ? (likes / total) * 100 : 0;
  const hasVotes = total > 0;

  return (
    <div className={`flex items-center gap-2 tabular-nums leading-none ${muted ? 'opacity-60' : ''}`}>
      {label && <span className="w-12 shrink-0 text-[9px] font-bold uppercase tracking-wider text-white/35">{label}</span>}
      <span className={`inline-flex items-baseline gap-1.5 shrink-0 text-positive font-semibold ${muted ? 'text-xs' : 'text-base'}`}>
        <span className={muted ? 'text-[10px]' : 'text-base'}>▲</span>{formatNumber(likes)}
        {totalLikes != null && <span className="text-xs font-normal text-positive/40">({formatNumber(totalLikes)})</span>}
      </span>
      <div className={`flex-1 rounded-full overflow-hidden flex ${muted ? 'h-1.5' : 'h-2.5'} ${hasVotes ? 'bg-negative/45' : 'bg-white/10'}`}>
        {hasVotes && likePct > 0 && <div className="h-full bg-positive" style={{ width: `${likePct}%` }} />}
      </div>
      <span className={`inline-flex items-baseline gap-1.5 shrink-0 text-negative font-semibold ${muted ? 'text-xs' : 'text-base'}`}>
        {totalDislikes != null && <span className="text-xs font-normal text-negative/40">({formatNumber(totalDislikes)})</span>}
        {formatNumber(dislikes)}<span className={muted ? 'text-[10px]' : 'text-base'}>▼</span>
      </span>
    </div>
  );
}
