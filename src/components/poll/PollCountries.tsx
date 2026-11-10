import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { Profile } from '../../types/profile';
import { useProfileCountries } from '../../hooks/useProfileCountries';
import { FlagImg } from '../common/CountryFlag';
import { HoverTip } from '../common/HoverTip';
import { getCountryName, isKnownCountry } from '../../utils/countries';
import { formatNumber } from '../../utils/formatNumber';
import { useI18n } from '../../i18n/I18nContext';
import { plural } from '../../i18n/pollStrings';
import { OptionAvatar, OptionMark, TiedMarks } from './OptionAvatar';

interface PollCountriesProps {
  profile: Profile;
  /** Show this many rows and a "+N" button for the rest - for a page that
   *  scrolls as a whole, where a second scroller inside it would trap the
   *  finger. Without it every row renders and the caller scrolls the box. */
  limit?: number;
}

// The poll's answers country by country: flag, name, a small stacked bar of
// that country's split and its vote count, sorted by votes. Uncapped - every
// country that voted is listed (the list scrolls), never a top-N.
export function PollCountries({ profile, limit }: PollCountriesProps) {
  const [expanded, setExpanded] = useState(false);
  const { locale, p } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const { data, isLoading } = useProfileCountries(profile.id);
  const position = new Map(profile.options.map((o) => [o.id, o.position]));
  const text = new Map(profile.options.map((o) => [o.id, o.text]));
  const option = new Map(profile.options.map((o) => [o.id, o]));
  const countries = data?.countries ?? [];

  if (isLoading && !data) return <p className="text-xs text-white/50 py-2">...</p>;
  if (countries.length === 0) return <p className="text-sm text-white/50 py-2">{p.countriesEmpty}</p>;

  const shown = limit && !expanded ? countries.slice(0, limit) : countries;
  const hidden = countries.length - shown.length;

  return (
    <div className="space-y-0.5 overflow-x-hidden">
      {shown.map((c, i) => {
        const name = getCountryName(c.code, locale);
        const parts = [...c.options].sort((a, b) => (position.get(a.optionId) ?? 0) - (position.get(b.optionId) ?? 0));
        const best = [...c.options].sort((a, b) => b.n - a.n);
        const tie = best.length > 1 && best[0].n === best[1].n;
        const tied = tie
          ? parts.filter((o) => o.n === best[0].n).map((o) => option.get(o.optionId)).filter((o) => !!o)
          : [];
        const clickable = isKnownCountry(c.code);
        const go = () => navigate('/c/' + c.code + location.search);
        const tip = `${name}: ` + parts.map((o) => `${text.get(o.optionId)} ${Math.round((o.n / c.total) * 100)}%`).join(', ');
        // The same split as a small table: the country and its total on top,
        // then every answer biggest first - mark, text, votes, share.
        const panel = (
          <div>
            <div className="flex items-center gap-2 pb-2 mb-2 border-b border-border">
              <FlagImg code={c.code} className="shrink-0" />
              <span className="flex-1 min-w-0 truncate text-sm font-semibold text-white">{name}</span>
              <span className="shrink-0 text-[13px] tabular-nums text-white/60">{plural(p.votes, locale, c.total, formatNumber)}</span>
            </div>
            <ul className="space-y-1.5">
              {best.map((o) => {
                const opt = option.get(o.optionId);
                return (
                  <li key={o.optionId} className="flex items-center gap-2 text-sm">
                    {opt && <OptionMark color={opt.color} imageUrl={opt.imageUrl} className="w-5 h-5" />}
                    <span className="flex-1 min-w-0 truncate text-white/80">{text.get(o.optionId)}</span>
                    <span className="shrink-0 tabular-nums font-semibold text-white">{formatNumber(o.n)}</span>
                    <span className="shrink-0 w-10 text-right tabular-nums text-white/60">{Math.round((o.n / c.total) * 100)}%</span>
                  </li>
                );
              })}
            </ul>
          </div>
        );
        return (
          <HoverTip key={c.code} label={tip} panel={panel} panelWidth={280} panelClassName="px-3 py-2.5" className="contents">
            <div
              role={clickable ? 'button' : undefined}
              tabIndex={clickable ? 0 : undefined}
              onClick={clickable ? go : undefined}
              onKeyDown={clickable ? (e) => { if (e.key === 'Enter') go(); } : undefined}
              className={`flex items-center gap-2.5 px-1.5 py-1.5 rounded select-none ${clickable ? 'cursor-pointer hover:bg-white/5' : ''}`}
              style={{ animation: 'stat-in 0.25s ease-out both', animationDelay: `${Math.min(i, 12) * 30}ms` }}
            >
              <FlagImg code={c.code} className="shrink-0" />
              <span className="text-sm text-white/85 w-28 sm:w-32 shrink-0 truncate">{name}</span>
              <span className="flex-1 flex h-2 rounded-full overflow-hidden gap-[2px] bg-white/5 min-w-[40px]" aria-hidden>
                {parts.map((o) => (
                  <span
                    key={o.optionId}
                    style={{ width: `${(o.n / c.total) * 100}%`, background: option.get(o.optionId)?.color }}
                  />
                ))}
              </span>
              {/* Who leads there: the answer's own mark, not its text - a
                  truncated "Aged Dutch ..." said less than the picture does.
                  A tie shows the tied answers' marks overlapped. */}
              <span className="w-10 shrink-0 flex justify-center" aria-hidden>
                {tie ? (
                  <TiedMarks options={tied} />
                ) : (() => {
                  const lead = option.get(best[0].optionId);
                  return lead?.imageUrl
                    ? <OptionAvatar color={lead.color} imageUrl={lead.imageUrl} className="w-5 h-5" />
                    : <span className="w-2.5 h-2.5 rounded-full" style={{ background: lead?.color }} />;
                })()}
              </span>
              <span className="text-[13px] tabular-nums text-white/70 w-9 shrink-0 text-right">{formatNumber(c.total)}</span>
            </div>
          </HoverTip>
        );
      })}
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          aria-label={plural(p.countries, locale, hidden)}
          className="mt-1 w-full flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors"
        >
          +{formatNumber(hidden)}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
    </div>
  );
}
