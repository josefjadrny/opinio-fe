import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nContext';
import { useFilters } from '../../context/useFilters';
import { useNewsItem } from '../../hooks/useNewsList';
import { useNoindex } from '../../hooks/useNoindex';
import { getCountryName } from '../../utils/countries';
import { FlagImg } from '../common/CountryFlag';
import { HoverTip } from '../common/HoverTip';
import { RoleBadge } from '../common/RoleBadge';
import { NewsList } from './NewsList';
import { NewsArticle } from './NewsArticle';
import { NEWS_COPY } from './newsCopy';

const BRAND = 'Opinio';

// The active filters as removable chips - the list follows the feed's
// filters, so this says which ones and lets them go without the header.
function FilterChips() {
  const { t, locale } = useI18n();
  const { country, roles, setCountry, toggleRole } = useFilters();
  if (!country && !roles.length) return <p className="text-sm text-white/50">{NEWS_COPY.allFilters}</p>;
  const x = (
    <svg className="w-3 h-3 opacity-60 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {country && (
        <button onClick={() => setCountry(undefined)} className="group inline-flex items-center gap-1.5 rounded-full bg-white/[0.07] ring-1 ring-white/15 hover:ring-white/30 pl-2 pr-2.5 py-1 text-xs font-medium text-white/85 transition-all">
          <FlagImg code={country} size={14} />
          {getCountryName(country, locale)}
          {x}
        </button>
      )}
      {roles.map((r) => (
        <HoverTip key={r} label={t.clearFilters}>
          <button onClick={() => toggleRole(r)} className="group inline-flex items-center gap-1 rounded-full hover:opacity-80 transition-opacity">
            <RoleBadge role={r} />
            {x}
          </button>
        </HoverTip>
      ))}
    </div>
  );
}

function ShareLink() {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  async function share() {
    const url = window.location.origin + window.location.pathname;
    if (typeof navigator.share === 'function') {
      try { await navigator.share({ title: document.title, url }); } catch { /* dismissed */ }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt(t.linkCopied, url);
    }
  }
  return (
    <HoverTip label={copied ? t.linkCopied : t.share}>
      <button onClick={share} aria-label={t.share} className="w-9 h-9 rounded-full bg-white/[0.06] ring-1 ring-white/10 hover:bg-white/[0.12] hover:ring-white/25 flex items-center justify-center text-white/70 hover:text-white transition-all">
        {copied ? (
          <svg className="w-4 h-4 text-positive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
        )}
      </button>
    </HoverTip>
  );
}

// /news and /n/:id on desktop: the news takes the map's place in the centre
// column (or the feed columns' place below 1366px) while Rising and Falling
// stay. The list and a story swap in one scroller; going back restores where
// the list was.
export function NewsPage({ newsId }: { newsId: string | null }) {
  const navigate = useNavigate();
  const location = useLocation();
  const item = useNewsItem(newsId);
  useNoindex(!!newsId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const listScroll = useRef(0);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = newsId ? 0 : listScroll.current;
  }, [newsId]);

  useEffect(() => {
    document.title = newsId ? (item.data ? `${item.data.title} - ${BRAND}` : BRAND) : `${NEWS_COPY.title} - ${BRAND}`;
  }, [newsId, item.data]);

  return (
    <div
      ref={scrollRef}
      onScroll={(e) => { if (!newsId) listScroll.current = e.currentTarget.scrollTop; }}
      className="@container relative flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain subtle-scrollbar"
    >
      <div aria-hidden className="news-page-glow pointer-events-none absolute inset-x-0 top-0 h-[480px]" />
      <div className="relative max-w-[1200px] mx-auto px-6 @[900px]:px-10 @[1200px]:px-14 pt-8 @[1000px]:pt-10 pb-16">
        {newsId ? (
          <div key={newsId} className="news-view-in">
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={() => navigate('/news' + location.search)}
                className="group inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] ring-1 ring-white/10 hover:bg-white/[0.12] hover:ring-white/25 pl-2.5 pr-4 py-1.5 text-sm font-medium text-white/75 hover:text-white transition-all"
              >
                <svg className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.25}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                {NEWS_COPY.back}
              </button>
              <ShareLink />
            </div>
            {item.data ? <NewsArticle news={item.data} /> : (
              <div className="flex justify-center py-16">
                <span className="block w-6 h-6 rounded-full border-2 border-white/15 border-t-white/70 animate-spin" />
              </div>
            )}
          </div>
        ) : (
          <div key="list" className="news-view-back">
            <header className="caption-enter mb-9">
              <div className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/60">
                <span className="relative inline-flex w-2 h-2">
                  <span className="absolute inset-0 rounded-full bg-accent animate-ping motion-reduce:hidden" />
                  <span className="relative w-2 h-2 rounded-full bg-accent" />
                </span>
                {NEWS_COPY.kicker}
              </div>
              <h1 className="mt-3 text-4xl @[900px]:text-5xl @[1100px]:text-6xl font-bold tracking-tight text-white">{NEWS_COPY.title}</h1>
              <p className="mt-2 text-[15px] @[1000px]:text-lg text-white/60">{NEWS_COPY.subtitle}</p>
              <div className="mt-4"><FilterChips /></div>
            </header>
            <NewsList />
          </div>
        )}
      </div>
    </div>
  );
}
