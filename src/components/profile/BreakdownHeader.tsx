import type { ReactNode } from 'react';
import { StatTip } from '../common/StatTip';
import { useI18n } from '../../i18n/I18nContext';

// Same sentence panel VoteHeadline uses for its figures, so the two explainers
// in the detail read as one set.
const PANEL_W = 236;

// Section header over a fans/critics country list. The label names the side
// and the window; the tip says what the rows are - countries of the voters,
// not of the opinio, ranked by votes and cut at ten - which the list itself
// never states. StatTip so a tap opens it on touch, where there is no hover.
export function BreakdownHeader({ side }: { side: 'like' | 'dislike' }) {
  const { t } = useI18n();
  const tone = side === 'like' ? 'text-positive' : 'text-negative';
  const label = side === 'like' ? t.breakdownLiking : t.breakdownDisliking;
  const help = side === 'like' ? t.breakdownLikingHelp : t.breakdownDislikingHelp;

  const plain = help.replace('{window}', t.voteTipWindow);
  const sentence: ReactNode = (
    <p className="text-sm text-white/80 leading-snug">
      {help.split(/(\{window\})/).map((part, i) =>
        part === '{window}'
          ? <strong key={i} className="font-semibold text-white">{t.voteTipWindow}</strong>
          : part,
      )}
    </p>
  );

  // `flex`, not block: StatTip's trigger is an inline-block button, and inside
  // a block the parent's 24px line box would sit it on the baseline with a
  // strip of dead space above it.
  return (
    <div className="flex mb-2 shrink-0">
      <StatTip
        label={plain}
        panel={sentence}
        width={PANEL_W}
        className={`text-xs font-bold uppercase tracking-wider px-1 -mx-1 hover:bg-white/5 ${tone}`}
      >
        {side === 'like' ? '▲' : '▼'} {label} {t.breakdownWindow}
      </StatTip>
    </div>
  );
}
