import { useEffect, type CSSProperties } from 'react';
import { useFilters } from '../../context/useFilters';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nContext';
import { getNewsList, getNewsOpinios } from '../../api/client';
import { getCountryName } from '../../utils/countries';
import { formatRelativeTime } from '../../utils/formatRelativeTime';
import { FlagImg } from '../common/CountryFlag';
import { HoverTip } from '../common/HoverTip';
import { RoleBadge } from '../common/RoleBadge';
import { LogoMark } from '../common/LogoMark';
import { ProfileCard } from '../profile/ProfileCard';
import { WASH } from '../common/wash';
import type { NewsItem } from '../../types/api';
import { NewsCard } from './NewsCard';
import { AiIcon, ExternalIcon, NewsPicture, NewsPill } from './NewsBits';
import { NewsLocator } from './NewsLocator';
import { NEWS_COPY, hostOf } from './newsCopy';

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-white/60">{children}</span>
      <span className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
    </div>
  );
}

// Up to three other stories from the same country, newest first.
function MoreFrom({ news }: { news: NewsItem }) {
  const { locale } = useI18n();
  const q = useQuery({
    queryKey: ['news', 'list', locale, news.countryCode, '', 'more'],
    queryFn: () => getNewsList(locale, { country: news.countryCode, limit: 4 }),
    staleTime: 60_000,
  });
  const more = (q.data?.items ?? []).filter((n) => n.id !== news.id).slice(0, 3);
  if (!more.length) return null;
  return (
    <section className="mt-10">
      <SectionLabel>{NEWS_COPY.moreFrom.replace('{country}', getCountryName(news.countryCode, locale))}</SectionLabel>
      <div className="space-y-2">
        {more.map((n, i) => <NewsCard key={n.id} news={n} index={i + 3} restoreCountry={news.countryCode} />)}
      </div>
    </section>
  );
}

// Where a story's country and category lead: the country page, and the list
// filtered by the category (the filters live in the query string, shared
// with the feed).
function useNewsLinks(news: NewsItem) {
  const navigate = useNavigate();
  const location = useLocation();
  return {
    toCountry: () => navigate('/c/' + news.countryCode + location.search),
    byRole: () => {
      const params = new URLSearchParams(location.search);
      const roles = (params.get('roles') ?? '').split(',').filter(Boolean);
      if (!roles.includes(news.role)) roles.push(news.role);
      params.set('roles', roles.join(','));
      navigate('/news?' + params.toString());
    },
  };
}

// The person, the country and the category under a story's title - in the
// hero and in the desktop window's header alike.
export function NewsMeta({ news }: { news: NewsItem }) {
  const { t, locale } = useI18n();
  const { toCountry, byRole } = useNewsLinks(news);
  const country = getCountryName(news.countryCode, locale);
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {news.person.name && <span className="text-sm font-medium text-white/80">{news.person.name}</span>}
      {news.person.name && <span className="text-white/30">·</span>}
      <HoverTip label={country}>
        <button onClick={toCountry} className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors">
          <FlagImg code={news.countryCode} size={16} />
          {country}
        </button>
      </HoverTip>
      <HoverTip label={`${t.filterBy}: ${t.roles[news.role]}`}>
        <button onClick={byRole} className="hover:opacity-70 transition-opacity">
          <RoleBadge role={news.role} />
        </button>
      </HoverTip>
    </div>
  );
}

// One story, full: the caption's anatomy at page size (picture, pill, title),
// the text, the way out to the source, where it happened, and the way in to
// an opinio about it. `hero: false` leaves the picture and title to the
// window header that holds the story (desktop).
export function NewsArticle({ news, hero = true }: { news: NewsItem; hero?: boolean }) {
  const navigate = useNavigate();
  const { setHoveredProfileCountry } = useFilters();
  // The story's country stays lit on the map behind the page while it is open.
  useEffect(() => {
    setHoveredProfileCountry(news.countryCode);
    return () => setHoveredProfileCountry(undefined);
  }, [news.countryCode, setHoveredProfileCountry]);
  const location = useLocation();
  const { t, locale } = useI18n();
  const country = getCountryName(news.countryCode, locale);
  const { toCountry } = useNewsLinks(news);
  const opinios = useQuery({
    queryKey: ['news', 'opinios', news.id, locale],
    queryFn: () => getNewsOpinios(news.id, locale),
    staleTime: 60_000,
  }).data?.profiles ?? [];

  return (
    <article>
      {/* Hero. Same entrance beats as the map caption's subject swap: the
          picture pops with an overshoot, the text rises after it. */}
      {hero && (
      <header className="caption-enter relative isolate">
        <div aria-hidden className="pointer-events-none absolute -inset-x-16 -inset-y-12 -z-10" style={{ background: 'radial-gradient(40% 65% at 14% 45%, rgba(233,69,96,0.16), transparent 70%)' }} />
        <div className="flex gap-5 @[640px]:gap-6 items-start">
          <span className="caption-mark news-ring shrink-0 rounded-full p-[3px]">
            <span className="block rounded-full p-[2px] bg-surface">
              <NewsPicture news={news} className="w-24 h-24 @[640px]:w-28 @[640px]:h-28 @[1000px]:w-36 @[1000px]:h-36" flagSize={56} credit />
            </span>
          </span>
          <div className="caption-text min-w-0 flex-1 pt-1">
            <div className="flex items-center gap-2 flex-wrap text-xs text-white/60">
              <NewsPill live />
              <span>{formatRelativeTime(news.createdAt, locale, t.justNow)}</span>
            </div>
            <h1 className="mt-2.5 text-2xl @[640px]:text-[32px] @[1000px]:text-[42px] font-bold text-white leading-[1.15] tracking-tight">{news.title}</h1>
            <div className="mt-3"><NewsMeta news={news} /></div>
          </div>
        </div>
      </header>
      )}

      <div className={`${hero ? 'mt-5 @[640px]:mt-8 @[1000px]:mt-12' : ''} grid gap-6 @[1000px]:gap-10 @[760px]:grid-cols-[1fr_260px] @[1000px]:grid-cols-[1fr_340px] items-start`}>
        <div className="activity-row-in" style={{ '--i': 1 } as CSSProperties}>
          <p className="text-base @[1000px]:text-[17px] text-white/85 leading-[1.7] max-w-[68ch]">{news.body}</p>
          {/* No badge in the header: a pill beside NEWS read as a second
              label as loud as the first, and the picture ring's red-to-green
              on it read as a vote. Quiet metadata where the AI text ends. */}
          <p className="mt-4 flex items-center gap-1.5 text-[13px] text-white/50 leading-snug max-w-[68ch]">
            <AiIcon className="w-4 h-4 shrink-0" />
            {t.newsAiNote}
          </p>
          <a
            href={news.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-5 inline-flex items-center gap-2 rounded-full bg-white/[0.07] ring-1 ring-white/15 hover:bg-white/[0.12] hover:ring-white/30 pl-4 pr-3.5 py-2 text-sm font-medium text-white/85 hover:text-white transition-all"
          >
            {NEWS_COPY.readSource.replace('{source}', news.sourceName)}
            <span className="text-white/40">{hostOf(news.sourceUrl)}</span>
            <ExternalIcon className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </div>

        {/* Where it happened - the map's job on every other page. Opens the
            country, like a flag does everywhere else. */}
        <HoverTip label={NEWS_COPY.openCountry.replace('{country}', country)} className="block">
          <button
            onClick={toCountry}
            style={{ '--i': 2 } as CSSProperties}
            className="activity-row-in group w-full max-w-[360px] @[760px]:max-w-none rounded-2xl bg-surface-light/60 backdrop-blur-md ring-1 ring-white/[0.08] hover:ring-white/20 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden text-left"
          >
            <NewsLocator code={news.countryCode} />
            <span className="flex items-center gap-2 px-3.5 py-2.5 border-t border-white/[0.06] text-sm text-white/80 group-hover:text-white transition-colors">
              <FlagImg code={news.countryCode} size={16} />
              <span className="flex-1 truncate">{country}</span>
              <span className="text-white/40 transition-transform duration-300 group-hover:translate-x-0.5">→</span>
            </span>
          </button>
        </HoverTip>
      </div>

      {/* The point of the page: from the story to an opinio about it - the
          opinios already linked to it (posted from here or linked by the
          API's news link job), then the way to add one. */}
      <section className="mt-10 activity-row-in" style={{ '--i': 3 } as CSSProperties}>
        <SectionLabel>{NEWS_COPY.opiniosTitle}</SectionLabel>
        {opinios.length > 0 && (
          <div className="mb-3 grid gap-2 @[760px]:grid-cols-2">
            {opinios.map((p) => <ProfileCard key={p.id} profile={p} />)}
          </div>
        )}
        <div className="relative isolate overflow-hidden rounded-2xl ring-1 ring-white/[0.08] bg-surface-light/60 backdrop-blur-md px-5 py-5 flex items-center gap-4">
          <div aria-hidden className="user-header-wash absolute inset-0 -z-10" style={WASH} />
          <span className="w-11 h-11 shrink-0 rounded-full bg-white/[0.07] ring-1 ring-white/15 flex items-center justify-center">
            <LogoMark className="w-6 h-6" />
          </span>
          <p className="flex-1 min-w-0 text-sm text-white/70">{opinios.length ? NEWS_COPY.opiniosMore : NEWS_COPY.opiniosEmpty}</p>
          <button
            onClick={() => navigate('/add' + location.search)}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-xl bg-accent text-white hover:bg-accent/90 shadow-lg shadow-accent/20 transition-all active:scale-95"
          >
            {NEWS_COPY.opiniosCta}
          </button>
        </div>
      </section>

      <MoreFrom news={news} />
    </article>
  );
}
