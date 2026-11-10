import { useLayoutEffect, useRef, useState } from 'react';
import type { PollCountry } from '../../types/api';
import type { Profile } from '../../types/profile';
import { getCountryName } from '../../utils/countries';
import { FlagImg } from '../common/CountryFlag';
import { useI18n } from '../../i18n/I18nContext';
import { plural } from '../../i18n/pollStrings';
import { useCountries } from '../../hooks/useCountries';
import { useCountryPolls } from '../../hooks/useCountryPolls';
import { formatNumber } from '../../utils/formatNumber';
import { PollThumb } from '../poll/PollThumb';
import { OptionMark } from '../poll/OptionAvatar';
import { CountrySplit } from '../country/CountrySplit';
import { ACTIVITY_RAMP, NO_DATA_FILL, activityBand } from './mapShared';

interface CountryTooltipProps {
  countryCode: string;
  position: { x: number; y: number };
  /** Hover dwelled long enough: fetch this country's polls. */
  fetchPolls: boolean;
  // Set while a poll is open (/p/:id): the tooltip shows how this country
  // answered THAT poll instead of its list of polls. null = nobody there voted.
  subjectPoll?: Profile | null;
  subjectCountry?: PollCountry | null;
}

const TOOLTIP_WIDTH = 380;
const PADDING = 12;

// Countries are about voters: hovering one says how many people there voted
// today and the polls they voted on most, each with the country's split and
// its leading answer (POLLS-DESIGN.md section 8). On a
// poll page it says how that country answered the open poll. The heading is
// the country page's own, so the hover reads as a preview of that page.
export function CountryTooltip({ countryCode, position, fetchPolls, subjectPoll, subjectCountry }: CountryTooltipProps) {
  const { t, p, locale } = useI18n();
  const tipRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ left: number; top: number } | null>(null);
  const subjectMode = subjectPoll !== undefined;
  const { data: countriesData } = useCountries();
  const activity = countriesData?.countries.find((c) => c.code === countryCode);
  const { data: polls, isLoading } = useCountryPolls(!subjectMode && fetchPolls ? countryCode : null, 'top', 3);

  useLayoutEffect(() => {
    const tip = tipRef.current;
    if (!tip) return;
    const w = tip.offsetWidth;
    const h = tip.offsetHeight;
    let left = position.x + PADDING;
    let top = position.y + PADDING;
    if (left + w > window.innerWidth - PADDING) left = position.x - w - PADDING;
    if (top + h > window.innerHeight - PADDING) top = position.y - h - PADDING;
    left = Math.max(PADDING, Math.min(left, window.innerWidth - w - PADDING));
    top = Math.max(PADDING, Math.min(top, window.innerHeight - h - PADDING));
    setCoords({ left, top });
  }, [position.x, position.y, polls, isLoading, subjectMode, subjectCountry]);

  const name = getCountryName(countryCode, locale);
  const today = activity?.today ?? 0;

  return (
    <div
      ref={tipRef}
      className="fixed z-50 bg-surface-light border border-border shadow-2xl shadow-black/50 pointer-events-none map-tip rounded-2xl p-3.5"
      style={{
        left: coords?.left ?? position.x + PADDING,
        top: coords?.top ?? position.y + PADDING,
        width: TOOLTIP_WIDTH,
        maxWidth: `calc(100vw - ${PADDING * 2}px)`,
        visibility: coords ? 'visible' : 'hidden',
      }}
    >
      {/* Same heading as the country page, so hover and page read as one. */}
      <div className="flex items-start gap-2.5">
        <FlagImg code={countryCode} size={22} className="shrink-0 mt-0.5 rounded-[3px]" />
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold text-white leading-snug">{p.countryAnswers.replace('{country}', name)}</p>
          {subjectMode ? (
            subjectCountry && subjectCountry.total > 0 && (
              <p className="mt-0.5 text-[13px] text-text-secondary tabular-nums">{plural(p.votes, locale, subjectCountry.total, formatNumber)}</p>
            )
          ) : (
            <p className="mt-1 flex items-center gap-1.5 text-[13px] text-text-secondary tabular-nums">
              {/* A miniature of the map legend's scale with this country's cell
                  outlined: the line explains the country's shade on the map,
                  and the ramp's dark greens are too close to the card for a
                  lone swatch to read as "that colour". */}
              <span aria-hidden className="flex h-2.5 w-14 gap-px shrink-0">
                {[NO_DATA_FILL, ...ACTIVITY_RAMP].map((c, i) => (
                  <span
                    key={i}
                    className={`flex-1 first:rounded-l-full last:rounded-r-full ${i === activityBand(today) ? 'ring-[1.5px] ring-white/80 relative z-10' : ''}`}
                    style={{ background: c }}
                  />
                ))}
              </span>
              {today > 0 ? p.votesTodayFrom.replace('{votes}', plural(p.votes, locale, today, formatNumber)) : p.noVotesToday}
            </p>
          )}
        </div>
      </div>

      {subjectMode ? (
        subjectCountry && subjectCountry.total > 0 && subjectPoll ? (
          <div className="mt-3 space-y-2">
            {[...subjectPoll.options]
              .map((o) => ({ o, n: subjectCountry.options.find((x) => x.optionId === o.id)?.n ?? 0 }))
              .sort((a, b) => b.n - a.n || a.o.position - b.o.position)
              .map(({ o, n }) => {
                const pct = Math.round((n / subjectCountry.total) * 100);
                return (
                  <div key={o.id} className="flex items-center gap-2.5">
                    <OptionMark color={o.color} imageUrl={o.imageUrl} className="w-7 h-7" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="flex-1 min-w-0 truncate text-sm text-white/90">{o.text}</span>
                        <span className="shrink-0 tabular-nums text-sm font-semibold text-white">{pct}%</span>
                      </div>
                      <span aria-hidden className="mt-1 block h-1 rounded-full bg-white/[0.07] overflow-hidden">
                        <span className="block h-full rounded-full" style={{ width: `${pct}%`, background: o.color }} />
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <p className="mt-2 text-[13px] text-text-secondary">{p.noVotesTodayFrom}</p>
        )
      ) : (
        <div className="mt-3 pt-3 border-t border-border">
          {(isLoading || !fetchPolls) && !polls ? (
            <p className="text-center text-text-secondary text-sm py-2">{t.loading}</p>
          ) : polls && polls.items.length > 0 ? (
            <div className="space-y-3">
              {polls.items.map((it) => {
                return (
                  <div key={it.poll.id} className="flex items-start gap-2.5">
                    <PollThumb role={it.poll.role} imageUrl={it.poll.contentImageUrl ?? it.poll.imageUrl} className="w-12 h-12 rounded-xl" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white leading-snug line-clamp-2">{it.poll.name}</p>
                      <div className="mt-1.5"><CountrySplit item={it} noBar /></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-text-secondary text-sm py-2">{p.countryNoPolls.replace('{country}', name)}</p>
          )}
        </div>
      )}
    </div>
  );
}
