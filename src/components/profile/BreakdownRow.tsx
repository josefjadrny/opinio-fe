import { useNavigate, useLocation } from 'react-router-dom';
import { FlagImg } from '../common/CountryFlag';
import { HoverTip } from '../common/HoverTip';
import { TIP_TEXT_CLASS, TIP_PANEL_W } from '../common/AnchoredTip';
import { getCountryName, isKnownCountry } from '../../utils/countries';
import { formatNumber } from '../../utils/formatNumber';
import { useI18n } from '../../i18n/I18nContext';

interface BreakdownRowProps {
  countryCode: string;
  count: number;
  // Distinct people behind `count` - the hover spells both out, since one
  // person can vote several times inside the 24h window.
  voters: number;
  // Largest count in this list - drives the relative bar width.
  max: number;
  // Stagger index for the entrance animation.
  index: number;
  side: 'like' | 'dislike';
}

// One country row in a profile's fans/critics breakdown. Clicking navigates to
// that country's detail page. Unknown voter codes (rare CF edge codes) render
// as plain, non-clickable rows so we never link to a not-found country.
export function BreakdownRow({ countryCode, count, voters, max, index, side }: BreakdownRowProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, locale } = useI18n();
  const clickable = isKnownCountry(countryCode);
  const go = () => navigate('/c/' + countryCode + location.search);

  const bar = side === 'like' ? 'bg-positive/15' : 'bg-accent/15';
  const num = side === 'like' ? 'text-positive' : 'text-negative';

  // Same panel as the sentiment bar's VoteStatTooltip: the side as a small
  // coloured header, the country under it, then label/value rows. The 24h
  // window sits on the header because it scopes both figures. Votes lead in
  // the side's colour - it is the row's own number - and voters follow in
  // white as the explainer: one person can vote
  // several times inside the window, which the row's number alone hides.
  const name = getCountryName(countryCode, locale);
  const sideLabel = side === 'like' ? t.voteTipLikes : t.voteTipDislikes;

  return (
    <HoverTip
      label={`${sideLabel} ${t.breakdownWindow} - ${name}: ${t.breakdownTipVotes} ${count}, ${t.breakdownTipVoters} ${voters}`}
      className="contents"
      panelClassName="px-3 py-2.5"
      panelWidth={TIP_PANEL_W}
      panel={
        <>
          <div className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${num}`}>
            <span className="text-base leading-none">{side === 'like' ? '▲' : '▼'}</span>
            <span>{sideLabel} {t.breakdownWindow}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 mb-2 text-sm font-semibold text-white">
            <FlagImg code={countryCode} />
            <span className="truncate">{name}</span>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className={TIP_TEXT_CLASS}>{t.breakdownTipVotes}</span>
            <span className={`text-base font-bold tabular-nums leading-none ${num}`}>{formatNumber(count)}</span>
          </div>
          <div className="flex items-baseline justify-between gap-2 mt-1.5">
            <span className={TIP_TEXT_CLASS}>{t.breakdownTipVoters}</span>
            <span className="text-sm font-semibold tabular-nums leading-none text-white">{formatNumber(voters)}</span>
          </div>
        </>
      }
    >
      <div
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        onClick={clickable ? go : undefined}
        onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } } : undefined}
        className={`relative flex items-center gap-1.5 mb-1 px-1.5 py-0.5 rounded overflow-hidden select-none cursor-help ${clickable ? 'hover:bg-white/5 transition-colors' : ''}`}
        style={{ animation: 'stat-in 0.25s ease-out both', animationDelay: `${index * 35}ms` }}
      >
        <div
          className={`absolute inset-y-0 left-0 ${bar} rounded`}
          style={{ width: `${(count / max) * 100}%`, animation: 'bar-fill 0.45s ease-out both', transformOrigin: 'left', animationDelay: `${index * 35 + 80}ms` }}
        />
        <FlagImg code={countryCode} className="relative inline-block align-middle shrink-0" />
        <span className="relative text-xs text-white/60 flex-1 truncate">{name}</span>
        <span className={`relative text-xs ${num} font-semibold tabular-nums`}>{formatNumber(count)}</span>
      </div>
    </HoverTip>
  );
}
