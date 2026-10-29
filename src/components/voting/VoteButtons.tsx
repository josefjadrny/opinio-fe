import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { formatNumber } from '../../utils/formatNumber';
import { useVote } from '../../hooks/useVote';
import { useMe } from '../../hooks/useMe';
import { useCountdown } from '../../hooks/useCountdown';
import { useAnimatedValue } from '../../hooks/useAnimatedValue';
import { useVoteAnimation } from '../../hooks/useVoteAnimation';
import { useI18n } from '../../i18n/I18nContext';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { HoverTip } from '../common/HoverTip';
import { TIP_TEXT_CLASS } from '../common/AnchoredTip';

// The "next vote in mm:ss" line, ticking only while its tip is open. The
// countdown used to live in VoteButtons itself, which put a 1s interval and a
// re-render per second on every card in the feed once a pool ran dry.
//
// At zero it refetches /api/me once: the fresh allowance clears nextAt, which
// drops the tip's label and with it the tip - rather than leaving an empty
// panel up until the next 10s poll. Only an open tip ever does this.
function NextVoteLine({ nextAt }: { nextAt: string }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { text } = useCountdown(nextAt);
  const expired = text === null;
  useEffect(() => {
    if (expired) queryClient.invalidateQueries({ queryKey: ['me'] });
  }, [expired, queryClient]);
  return <span className={`block whitespace-nowrap ${TIP_TEXT_CLASS}`}>{t.nextVote} {text ?? '00:00'}</span>;
}

interface VoteButtonsProps {
  profileId: string;
  likes: number;
  dislikes: number;
  compact?: boolean;
  showOnly?: 'like' | 'dislike';
  reverseVotes?: boolean;
}

export function VoteButtons({ profileId, likes, dislikes, compact, showOnly, reverseVotes }: VoteButtonsProps) {
  const voteMutation = useVote();
  const { data: me } = useMe();
  const { t } = useI18n();
  const animatedLikes = useAnimatedValue(likes);
  const animatedDislikes = useAnimatedValue(dislikes);

  const likeAnim = useVoteAnimation();
  const dislikeAnim = useVoteAnimation();

  // A vote posted with no network just fails silently, so gate the buttons the
  // same way the allowance gate does and say why in the tooltip.
  const online = useOnlineStatus();
  const hasCountry = me === undefined || !!me.user.countryCode;
  const isRegistered = !!me?.user && me.user.tier !== 'anonymous';
  const noCountryMsg = isRegistered ? t.noCountryWarningRegistered : t.noCountryWarning;
  const canLike = online && hasCountry && (me?.voteAllowance.like.remaining ?? 0) > 0;
  const canDislike = online && hasCountry && (me?.voteAllowance.dislike.remaining ?? 0) > 0;
  const likeNextAt = !canLike && hasCountry ? me?.voteAllowance.like.nextAt ?? null : null;
  const dislikeNextAt = !canDislike && hasCountry ? me?.voteAllowance.dislike.nextAt ?? null : null;
  // Offline / no country take the plain one-line label; otherwise a dry pool
  // gets the live countdown panel (the label then only keys re-measurement).
  const tipFor = (nextAt: string | null) => ({
    label: !online ? t.offlineVote : !hasCountry ? noCountryMsg : (nextAt ? t.nextVote : null),
    panel: online && hasCountry && nextAt ? <NextVoteLine nextAt={nextAt} /> : undefined,
  });

  const handleVote = (e: React.MouseEvent, type: 'like' | 'dislike') => {
    e.stopPropagation();
    voteMutation.mutate({ profileId, type });
    if (type === 'like') likeAnim.trigger();
    else dislikeAnim.trigger();
  };

  const btnBase = compact
    ? 'flex items-center gap-1 px-1.5 py-[5px] rounded text-xs font-medium transition-all'
    : 'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-medium transition-all';
  // Disabled keeps the like/dislike color identity (just dimmed) so users can
  // still tell ▲ from ▼ at a glance even when they can't currently cast.
  const likeDisabledClass = 'bg-positive/5 text-positive/50 ring-1 ring-positive/10 cursor-not-allowed';
  const dislikeDisabledClass = 'bg-negative/5 text-negative/50 ring-1 ring-negative/10 cursor-not-allowed';

  const likeBtn = (!showOnly || showOnly === 'like') && (
    <div className="relative">
      {/* Particles */}
      {likeAnim.particles.map((p) => (
        <span
          key={p.id}
          className="vote-particle text-positive"
          style={{
            fontSize: Math.min(0.7 + p.streak * 0.12, 1.3) + 'rem',
            marginBottom: compact ? 2 : 4,
          }}
        >
          {p.streak >= 5 ? '🔥' : p.streak >= 3 ? `+${p.streak}` : '+1'}
        </span>
      ))}
      <HoverTip {...tipFor(likeNextAt)} className="contents">
      <button
        key={likeAnim.bumpKey}
        onClick={(e) => handleVote(e, 'like')}
        disabled={!canLike}
        className={`vote-bump ${btnBase} ${
          canLike
            ? 'bg-positive/20 text-positive hover:bg-positive/30 cursor-pointer'
            : likeDisabledClass
        }`}
      >
        <span>&#9650;&#xFE0E;</span>
        <span className="tabular-nums inline-block text-right min-w-[3ch]">{formatNumber(animatedLikes)}</span>
      </button>
      </HoverTip>
    </div>
  );

  const dislikeBtn = (!showOnly || showOnly === 'dislike') && (
    <div className="relative">
      {dislikeAnim.particles.map((p) => (
        <span
          key={p.id}
          className="vote-particle text-negative"
          style={{
            fontSize: Math.min(0.7 + p.streak * 0.12, 1.3) + 'rem',
            marginBottom: compact ? 2 : 4,
          }}
        >
          {p.streak >= 5 ? '💥' : p.streak >= 3 ? `+${p.streak}` : '+1'}
        </span>
      ))}
      <HoverTip {...tipFor(dislikeNextAt)} className="contents">
      <button
        key={dislikeAnim.bumpKey}
        onClick={(e) => handleVote(e, 'dislike')}
        disabled={!canDislike}
        className={`vote-bump ${btnBase} ${
          canDislike
            ? 'bg-negative/20 text-negative hover:bg-negative/30 cursor-pointer'
            : dislikeDisabledClass
        }`}
      >
        <span>&#9660;&#xFE0E;</span>
        <span className="tabular-nums inline-block text-right min-w-[3ch]">{formatNumber(animatedDislikes)}</span>
      </button>
      </HoverTip>
    </div>
  );

  return (
    <div className="flex items-center gap-2">
      {reverseVotes ? <>{dislikeBtn}{likeBtn}</> : <>{likeBtn}{dislikeBtn}</>}
    </div>
  );
}
