import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nContext';
import { useFilters } from '../../context/useFilters';
import { useNewsItem } from '../../hooks/useNewsList';
import { useNoindex } from '../../hooks/useNoindex';
import { useModalClose } from '../../hooks/useModalClose';
import { getCountryName } from '../../utils/countries';
import { FlagImg } from '../common/CountryFlag';
import { HoverTip } from '../common/HoverTip';
import { RoleBadge } from '../common/RoleBadge';
import { WASH } from '../common/wash';
import { formatRelativeTime } from '../../utils/formatRelativeTime';
import type { NewsItem } from '../../types/api';
import { NewsList } from './NewsList';
import { NewsArticle, NewsMeta } from './NewsArticle';
import { NewsIcon, NewsPicture, NewsPill } from './NewsBits';
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

// The quiet icon button every window header carries (ModalShell's close).
const HEADER_BTN = 'text-white/40 hover:text-white/80 transition-colors p-1';

// The window's X. On the list it goes back to the map, filters kept, like the
// header's news button; a story passes `onClose` to step back to wherever it
// was opened from.
function CloseNews({ onClose }: { onClose?: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();
  return (
    <HoverTip label={t.close}>
      <button onClick={onClose ?? (() => navigate('/' + location.search))} aria-label={t.close} className={HEADER_BTN}>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </HoverTip>
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
      <button onClick={share} aria-label={t.share} className={HEADER_BTN}>
        {copied ? (
          <svg className="w-5 h-5 text-positive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
        )}
      </button>
    </HoverTip>
  );
}

function NewsDisc() {
  return (
    <span className="w-9 h-9 rounded-full bg-white/[0.07] ring-1 ring-white/15 flex items-center justify-center shrink-0">
      <NewsIcon className="w-[22px] h-[22px]" brand />
    </span>
  );
}

// The story's header, laid out like the opinio detail's: picture,
// then source and time over the title over who/where/what, actions right.
function StoryHeader({ news }: { news: NewsItem | undefined }) {
  const close = useModalClose();
  const { t, locale } = useI18n();
  if (!news) {
    return (
      <div className="flex items-center gap-2.5">
        <NewsDisc />
        <h1 className="flex-1 text-base font-semibold text-white">{NEWS_COPY.title}</h1>
        <CloseNews onClose={close} />
      </div>
    );
  }
  return (
    <div key={news.id} className="caption-enter flex items-start gap-3">
      <span className="caption-mark news-ring shrink-0 self-center rounded-full p-[2px]">
        <span className="block rounded-full p-[2px] bg-surface">
          <NewsPicture news={news} className="w-14 h-14 2xl:w-[72px] 2xl:h-[72px]" flagSize={28} credit />
        </span>
      </span>
      <div className="caption-text min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap text-xs text-white/60">
          <NewsPill live />
          <span>{news.sourceName} · {formatRelativeTime(news.createdAt, locale, t.justNow)}</span>
        </div>
        <h1 className="mt-1.5 text-lg font-semibold text-white leading-snug">{news.title}</h1>
        <div className="mt-1.5"><NewsMeta news={news} /></div>
      </div>
      <div className="shrink-0 flex items-center gap-1">
        <ShareLink />
        <CloseNews onClose={close} />
      </div>
    </div>
  );
}

// /news and /n/:id on desktop: a window in the map's place in the centre
// column (or the feed columns' place below 1366px) while Rising and Falling
// stay - built like every other window (panel, washed header bar, X), with
// the dimmed map showing round its edges. The list and a story swap in one
// scroller; going back restores where the list was.
export function NewsPage({ newsId }: { newsId: string | null }) {
  const navigate = useNavigate();
  const location = useLocation();
  const item = useNewsItem(newsId);
  useNoindex(!!newsId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const listScroll = useRef(0);

  // Escape is the X: a story steps back to where it was opened from (the
  // list, the map, an opinio, another story), the list back to the map.
  const closeStory = useModalClose();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      if (newsId) closeStory();
      else navigate('/' + location.search);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [newsId, navigate, location.search, closeStory]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = newsId ? 0 : listScroll.current;
  }, [newsId]);

  useEffect(() => {
    document.title = newsId ? (item.data ? `${item.data.title} - ${BRAND}` : BRAND) : `${NEWS_COPY.title} - ${BRAND}`;
  }, [newsId, item.data]);

  return (
    <div className="relative flex-1 min-h-0 flex flex-col px-4 pt-4 pb-3">
      <div
        className="flex-1 min-h-0 flex flex-col bg-surface border border-border rounded-2xl shadow-2xl shadow-black/50 overflow-hidden"
        style={{ animation: 'modal-enter 0.2s ease-out' }}
      >
        <div className="user-header-wash shrink-0 px-6 py-4 border-b border-border" style={WASH}>
          {newsId ? <StoryHeader news={item.data} /> : (
            <div className="flex items-center gap-2.5">
              <NewsDisc />
              <h1 className="text-base font-semibold text-white">{NEWS_COPY.title}</h1>
              <div className="flex-1 min-w-0 ml-3"><FilterChips /></div>
              <CloseNews />
            </div>
          )}
        </div>
        <div
          ref={scrollRef}
          onScroll={(e) => { if (!newsId) listScroll.current = e.currentTarget.scrollTop; }}
          className="@container flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain subtle-scrollbar"
        >
          <div className="px-6 pt-6 pb-12">
            {newsId ? (
              <div key={newsId} className="news-view-in">
                {item.data ? <NewsArticle news={item.data} hero={false} /> : (
                  <div className="flex justify-center py-16">
                    <span className="block w-6 h-6 rounded-full border-2 border-white/15 border-t-white/70 animate-spin" />
                  </div>
                )}
              </div>
            ) : (
              <div key="list" className="news-view-back"><NewsList /></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
