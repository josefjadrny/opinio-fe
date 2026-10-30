import { useEffect, useRef, type CSSProperties, type KeyboardEvent, type MouseEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nContext';
import { useFilters } from '../../context/useFilters';
import { getCountryName } from '../../utils/countries';
import { formatRelativeTime } from '../../utils/formatRelativeTime';
import { FlagImg } from '../common/CountryFlag';
import { HoverTip } from '../common/HoverTip';
import { RoleBadge } from '../common/RoleBadge';
import type { NewsItem } from '../../types/api';
import { AiSource, NewsPicture, NewsPill } from './NewsBits';

// How long the pointer must rest on a card before its country lights on the
// map behind. Scrolling slides cards under a still pointer and fires an enter
// on each; without the dwell the map flickered from country to country.
const HOVER_DWELL = 350;

// The brand red the news pill carries, as the card's hover glow - the sidebar
// cards glow in their side's colour, a news card in the news colour.
const GLOW = 'rgba(233,69,96,0.16)';

interface NewsCardProps {
  news: NewsItem;
  // The newest story: a bigger card with the live pill and a drifting wash.
  lead?: boolean;
  // Row index for the staggered entrance (capped by the caller).
  index?: number;
  // Arrived while the page was open: rises in and flashes its edge.
  arrived?: boolean;
  // What the backdrop map lights once the pointer leaves - an open story's
  // own country, under its "more from" cards.
  restoreCountry?: string;
}

// One story in the list, built like the sidebar's opinio card: flat surface,
// a glow that fades in on hover, a small lift. The whole card opens the story;
// the flag opens the country and the category filters by it, as on an opinio.
export function NewsCard({ news, lead = false, index = 0, arrived = false, restoreCountry }: NewsCardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, locale } = useI18n();
  const { toggleRole, setHoveredProfileCountry } = useFilters();
  const country = getCountryName(news.countryCode, locale);

  const dwell = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(dwell.current), []);
  const open = () => {
    clearTimeout(dwell.current);
    setHoveredProfileCountry(undefined);
    navigate('/n/' + news.id + location.search);
  };
  // Lights the story's country on the map behind the page, as an opinio card
  // does on the map itself - only once the pointer has settled on the card.
  // The timer re-checks :hover because a scroll that moves the card away from
  // a still pointer does not always deliver the leave first.
  const hover = {
    onMouseEnter: (e: MouseEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      clearTimeout(dwell.current);
      dwell.current = setTimeout(() => { if (el.matches(':hover')) setHoveredProfileCountry(news.countryCode); }, HOVER_DWELL);
    },
    onMouseLeave: () => {
      clearTimeout(dwell.current);
      setHoveredProfileCountry(restoreCountry);
    },
  };
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } };
  const toCountry = (e: MouseEvent) => { e.stopPropagation(); navigate('/c/' + news.countryCode + location.search); };
  const byRole = (e: MouseEvent) => { e.stopPropagation(); toggleRole(news.role); };

  const tags = (
    <span className="flex items-center gap-1.5 shrink-0">
      <HoverTip label={country}>
        <span role="link" tabIndex={0} aria-label={country} onClick={toCountry} className="inline-flex cursor-pointer hover:opacity-70 transition-opacity">
          <FlagImg code={news.countryCode} size={lead ? 18 : 15} />
        </span>
      </HoverTip>
      <HoverTip label={`${t.filterBy}: ${t.roles[news.role]}`}>
        <span role="button" tabIndex={0} onClick={byRole} className="cursor-pointer hover:opacity-70 transition-opacity">
          <RoleBadge role={news.role} />
        </span>
      </HoverTip>
    </span>
  );

  const time = formatRelativeTime(news.createdAt, locale, t.justNow);
  const entrance = arrived ? 'comment-arrive' : 'activity-row-in';
  const style = { '--i': index } as CSSProperties;

  if (lead) {
    return (
      <div
        role="link"
        tabIndex={0}
        onClick={open}
        onKeyDown={onKey}
        {...hover}
        style={style}
        className={`${entrance} group relative isolate overflow-hidden rounded-2xl bg-surface-light/60 backdrop-blur-md ring-1 ring-white/[0.08] hover:ring-white/20 hover:-translate-y-0.5 shadow-xl shadow-black/20 transition-all duration-300 cursor-pointer select-none`}
      >
        <div aria-hidden className="news-aurora absolute inset-0 -z-10" />
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(90% 120% at 0% 0%, ${GLOW}, transparent 65%)` }} />
        <div className="flex gap-5 @[1000px]:gap-7 p-5 @[640px]:p-6 @[1000px]:p-7">
          <span className="news-ring shrink-0 self-start rounded-full p-[3px] transition-transform duration-500 ease-out group-hover:scale-[1.04]">
            <span className="block rounded-full p-[2px] bg-surface-light">
              <NewsPicture news={news} className="w-20 h-20 @[640px]:w-24 @[640px]:h-24 @[1000px]:w-28 @[1000px]:h-28" flagSize={44} />
            </span>
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 min-w-0 text-xs text-white/60">
              <NewsPill live />
              <AiSource name={news.sourceName} time={time} />
            </div>
            <h3 className="mt-2 text-xl @[640px]:text-2xl @[1000px]:text-[30px] font-bold text-white leading-tight tracking-tight">{news.title}</h3>
            <p className="mt-1.5 @[1000px]:mt-2.5 text-[15px] @[1000px]:text-base text-text-secondary leading-relaxed line-clamp-3 max-w-[72ch]">{news.body}</p>
            <div className="mt-3">{tags}</div>
          </div>
        </div>
      </div>
    );
  }

  // A row of the timeline: full width, so a day with one story and a day with
  // nine read the same - no grid cell left empty by an odd count or a short
  // card. Source and tags share the top line; title and two lines of text.
  // The picture spans the whole row from 520px; on a phone it spans only the
  // source line and the title, and the text runs the card's full width under
  // it - a column held empty below the picture cost a line of every card.
  return (
    <div
      role="link"
      tabIndex={0}
      onClick={open}
      onKeyDown={onKey}
      {...hover}
      style={style}
      className={`${entrance} group relative isolate overflow-hidden grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 @[1000px]:gap-x-4 px-3 py-2.5 @[520px]:px-3.5 @[520px]:py-3 @[1000px]:px-4 @[1000px]:py-3.5 rounded-xl bg-surface-light/60 backdrop-blur-md ring-1 ring-white/[0.06] hover:ring-white/15 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer select-none`}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: `radial-gradient(120% 90% at 0% 0%, ${GLOW}, transparent 60%)` }} />
      {arrived && <div aria-hidden className="comment-flash pointer-events-none absolute inset-0 rounded-[inherit] ring-2 ring-accent/80" />}
      <NewsPicture news={news} className="row-span-2 @[520px]:row-span-3 self-center @[520px]:self-start w-11 h-11 @[520px]:w-12 @[520px]:h-12 @[760px]:w-14 @[760px]:h-14 @[1000px]:w-[72px] @[1000px]:h-[72px] shrink-0 ring-2 ring-white/5 transition-transform duration-500 ease-out group-hover:scale-[1.06]" flagSize={24} />
      <div className="flex items-center gap-3 min-w-0">
        <AiSource name={news.sourceName} time={time} className="flex-1 text-xs text-white/50" />
        {tags}
      </div>
      <div className="mt-0.5 @[520px]:mt-1 text-[15px] @[1000px]:text-[17px] font-semibold text-white leading-snug">{news.title}</div>
      <p className="col-span-2 @[520px]:col-span-1 mt-1 @[520px]:mt-0.5 text-[13px] @[1000px]:text-sm text-text-secondary leading-snug line-clamp-2">{news.body}</p>
    </div>
  );
}
