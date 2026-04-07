import { formatNumber } from '../../utils/formatNumber';
import { useVote } from '../../hooks/useVote';
import { useMe } from '../../hooks/useMe';

interface VoteButtonsProps {
  profileId: string;
  likes: number;
  dislikes: number;
  myVote: 'like' | 'dislike' | null;
  compact?: boolean;
  showOnly?: 'like' | 'dislike';
}

export function VoteButtons({ profileId, likes, dislikes, myVote, compact, showOnly }: VoteButtonsProps) {
  const voteMutation = useVote();
  const { data: me } = useMe();

  const canLike = !myVote && (me?.voteAllowance.like.remaining ?? 0) > 0;
  const canDislike = !myVote && (me?.voteAllowance.dislike.remaining ?? 0) > 0;

  const handleVote = (type: 'like' | 'dislike') => {
    if (myVote) return;
    voteMutation.mutate({ profileId, type });
  };

  const btnBase = compact
    ? 'flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium transition-all'
    : 'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-medium transition-all';

  return (
    <div className="flex items-center gap-2">
      {(!showOnly || showOnly === 'like') && (
        <button
          onClick={() => handleVote('like')}
          disabled={!canLike}
          className={`${btnBase} ${
            myVote === 'like'
              ? 'bg-positive text-white'
              : canLike
                ? 'bg-positive/20 text-positive hover:bg-positive/30'
                : 'bg-white/5 text-white/30 cursor-not-allowed'
          }`}
        >
          <span>&#9650;</span>
          <span className="tabular-nums">{formatNumber(likes)}</span>
        </button>
      )}

      {(!showOnly || showOnly === 'dislike') && (
        <button
          onClick={() => handleVote('dislike')}
          disabled={!canDislike}
          className={`${btnBase} ${
            myVote === 'dislike'
              ? 'bg-negative text-white'
              : canDislike
                ? 'bg-negative/20 text-negative hover:bg-negative/30'
                : 'bg-white/5 text-white/30 cursor-not-allowed'
          }`}
        >
          <span>&#9660;</span>
          <span className="tabular-nums">{formatNumber(dislikes)}</span>
        </button>
      )}
    </div>
  );
}
