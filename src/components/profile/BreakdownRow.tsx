import { useNavigate, useLocation } from 'react-router-dom';
import { FlagImg } from '../common/CountryFlag';
import { getCountryName, isKnownCountry } from '../../utils/countries';
import { formatNumber } from '../../utils/formatNumber';

interface BreakdownRowProps {
  countryCode: string;
  count: number;
  // Largest count in this list - drives the relative bar width.
  max: number;
  // Stagger index for the entrance animation.
  index: number;
  side: 'like' | 'dislike';
}

// One country row in a profile's fans/critics breakdown. Clicking navigates to
// that country's detail page. Unknown voter codes (rare CF edge codes) render
// as plain, non-clickable rows so we never link to a not-found country.
export function BreakdownRow({ countryCode, count, max, index, side }: BreakdownRowProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const clickable = isKnownCountry(countryCode);
  const go = () => navigate('/c/' + countryCode + location.search);

  const bar = side === 'like' ? 'bg-positive/15' : 'bg-accent/15';
  const num = side === 'like' ? 'text-positive' : 'text-negative';

  return (
    <div
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? go : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } } : undefined}
      title={clickable ? getCountryName(countryCode) : undefined}
      className={`relative flex items-center gap-1.5 mb-1 px-1.5 py-0.5 rounded overflow-hidden select-none ${clickable ? 'cursor-pointer hover:bg-white/5 transition-colors' : ''}`}
      style={{ animation: 'stat-in 0.25s ease-out both', animationDelay: `${index * 35}ms` }}
    >
      <div
        className={`absolute inset-y-0 left-0 ${bar} rounded`}
        style={{ width: `${(count / max) * 100}%`, animation: 'bar-fill 0.45s ease-out both', transformOrigin: 'left', animationDelay: `${index * 35 + 80}ms` }}
      />
      <FlagImg code={countryCode} className="relative inline-block align-middle shrink-0" />
      <span className="relative text-xs text-white/60 flex-1 truncate">{getCountryName(countryCode)}</span>
      <span className={`relative text-xs ${num} font-semibold tabular-nums`}>{formatNumber(count)}</span>
    </div>
  );
}
