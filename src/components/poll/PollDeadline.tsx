import type { ReactNode } from 'react';
import { usePollDeadline } from '../../hooks/usePollDeadline';
import { useI18n } from '../../i18n/I18nContext';
import { plural } from '../../i18n/pollStrings';
import { formatPollDateTime, formatTimeLeft } from '../../utils/formatRelativeTime';
import { StatTip } from '../common/StatTip';
import { TIP_TEXT_CLASS } from '../common/AnchoredTip';
import { LockIcon, TimerIcon } from './PollIcons';

interface PollDeadlineProps {
  endsAt: string | undefined;
  /** 'short' (lists): "2 days left" / "Closed". 'full' (detail headers,
   *  preview): "2 days left to vote" / "Voting closed", with the exact end
   *  in a tooltip. */
  variant: 'short' | 'full';
  className?: string;
  /** Rendered before it, only when it renders (the " · " in a meta line). */
  lead?: ReactNode;
}

// How long a poll still takes votes - only in its last 3 days, everywhere:
// "150 days left" changes nobody's vote, so before that nothing is shown (the
// user's call). Said quietly: plain secondary text, no badge colour (orange
// and amber are reserved); an ended poll drops to the faintest tier.
export function PollDeadline({ endsAt, variant, className = '', lead }: PollDeadlineProps) {
  const { p, locale } = useI18n();
  const phase = usePollDeadline(endsAt);
  if (!endsAt || phase === 'open') return null;

  let text: string;
  if (phase === 'ended') {
    // No date in the line: it is under the answers and in the tooltip.
    text = variant === 'short' ? p.ended : p.votingClosed;
  } else {
    const { count, label } = formatTimeLeft(endsAt, locale);
    text = plural(variant === 'short' ? p.timeLeft : p.timeLeftToVote, locale, count, () => label);
  }
  // The colour lives here, never in className (two text colours on one
  // element resolve by stylesheet order, not by class order).
  const tone = phase === 'soon' ? 'text-white/80' : 'text-white/50';
  const line = (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap ${tone}`}>
      {/* Two-tone like every app icon; the ended lock faded, so a closed
          poll stays quiet. */}
      {phase === 'ended'
        ? <LockIcon className="w-3.5 h-3.5 opacity-60" />
        : <TimerIcon className="w-3.5 h-3.5" />}
      {text}
    </span>
  );

  // Lists stay plain: a tap on a card opens the poll. In the detail and the
  // preview the line is a StatTip (hover on desktop, tap on a phone - HoverTip
  // ignores touch) naming the exact end.
  if (variant === 'short') return <>{lead}<span className={`inline-flex ${className}`}>{line}</span></>;
  const exact = (phase === 'ended' ? p.closedOnTip : p.closesOnTip).replace('{date}', formatPollDateTime(endsAt, locale));
  return (
    <>
      {lead}
      <StatTip
        label={`${text}. ${exact}`}
        panelClassName="px-2.5 py-1.5"
        panel={<span className={`block whitespace-nowrap ${TIP_TEXT_CLASS}`}>{exact}</span>}
        className={`text-left ${className}`}
      >
        {line}
      </StatTip>
    </>
  );
}
