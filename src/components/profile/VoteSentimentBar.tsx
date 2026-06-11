import { formatNumber } from '../../utils/formatNumber';

interface VoteSentimentBarProps {
  likes: number;
  dislikes: number;
  /** All-time totals — shown in muted brackets next to the live counts. */
  totalLikes?: number;
  totalDislikes?: number;
}

// Horizontal likes-vs-dislikes proportion bar. The green segment's width is
// likes' share of the total; red fills the remainder, so the split point reads
// as the sentiment at a glance. Live counts sit at each end, with the all-time
// totals (when given) alongside in muted brackets. With no votes the track is a
// neutral grey with no fill.
export function VoteSentimentBar({ likes, dislikes, totalLikes, totalDislikes }: VoteSentimentBarProps) {
  const total = likes + dislikes;
  const likePct = total > 0 ? (likes / total) * 100 : 0;
  const hasVotes = total > 0;

  return (
    <div className="flex items-center gap-2 tabular-nums leading-none">
      <span className="inline-flex items-baseline gap-1.5 shrink-0 text-positive font-semibold text-base">
        <span className="text-base">▲</span>{formatNumber(likes)}
        {totalLikes != null && totalLikes !== likes && <span className="text-xs font-normal text-positive/40">({formatNumber(totalLikes)})</span>}
      </span>
      <div className={`flex-1 h-2.5 rounded-full overflow-hidden flex ${hasVotes ? 'bg-negative/45' : 'bg-white/10'}`}>
        {hasVotes && likePct > 0 && <div className="h-full bg-positive" style={{ width: `${likePct}%` }} />}
      </div>
      <span className="inline-flex items-baseline gap-1.5 shrink-0 text-negative font-semibold text-base">
        {totalDislikes != null && totalDislikes !== dislikes && <span className="text-xs font-normal text-negative/40">({formatNumber(totalDislikes)})</span>}
        {formatNumber(dislikes)}<span className="text-base">▼</span>
      </span>
    </div>
  );
}
