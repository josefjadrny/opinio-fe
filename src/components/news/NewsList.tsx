import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { useFilters } from '../../context/useFilters';
import { useNewsList } from '../../hooks/useNewsList';
import type { NewsItem } from '../../types/api';
import { NewsCard } from './NewsCard';
import { NewsIcon } from './NewsBits';
import { NEWS_COPY } from './newsCopy';

// The entrance stagger stops here so a long list does not keep its last rows
// waiting (the same cap the user page's activity rows use).
const STAGGER_CAP = 8;

// "Today", "Yesterday", then the weekday and date - Intl names them in every
// language we ship, so no strings are needed.
function dayLabel(iso: string, locale: string): string {
  const d = new Date(iso);
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((start(new Date()) - start(d)) / 86_400_000);
  const label = days < 2
    ? new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(-days, 'day')
    : new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(d);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function groupByDay(items: NewsItem[], locale: string) {
  const groups: { label: string; items: NewsItem[] }[] = [];
  for (const n of items) {
    const label = dayLabel(n.createdAt, locale);
    if (groups.at(-1)?.label === label) groups.at(-1)!.items.push(n);
    else groups.push({ label, items: [n] });
  }
  return groups;
}

function clock(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

// A day's stories on a rail: the time on the left, a dot on the line, the
// card on the right. Hovering a row lights its dot; a story that arrived
// while the page was open keeps a pulsing red dot. Below 520px (a phone) the
// rail would take a fifth of the width from the cards, so it goes and the
// cards stack plainly - each still says how long ago it was.
function Timeline({ items, locale, arrived, startIndex }: {
  items: NewsItem[];
  locale: string;
  arrived: (id: string) => boolean;
  startIndex: number;
}) {
  return (
    <ol className="relative">
      <span aria-hidden className="hidden @[520px]:block absolute left-[60px] top-4 bottom-4 w-px bg-gradient-to-b from-white/15 via-white/[0.08] to-white/[0.02]" />
      {items.map((n, i) => {
        const fresh = arrived(n.id);
        return (
          <li key={n.id} className="group/row relative flex pb-2 last:pb-0">
            <time dateTime={n.createdAt} className="hidden @[520px]:block w-[52px] shrink-0 pt-[13px] text-right text-xs font-medium tabular-nums text-white/50 group-hover/row:text-white/80 transition-colors">
              {clock(n.createdAt, locale)}
            </time>
            <span className="hidden @[520px]:flex relative w-[17px] shrink-0 justify-center pt-[17px]">
              {fresh && <span className="absolute top-[17px] w-2.5 h-2.5 rounded-full bg-accent animate-ping motion-reduce:hidden" />}
              <span className={`relative w-2.5 h-2.5 rounded-full ring-[3px] ring-surface transition-colors duration-200 ${fresh ? 'bg-accent' : 'bg-white/25 group-hover/row:bg-accent'}`} />
            </span>
            <div className="flex-1 min-w-0 @[520px]:pl-3">
              <NewsCard news={n} index={Math.min(startIndex + i, STAGGER_CAP)} arrived={fresh} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// Loads the next page before the reader reaches the end. The list sits in
// the page's scroller on desktop and in the sheet's body on mobile, so the
// observer watches whichever scrolling ancestor it finds - only a root of its
// own can take the margin that starts the load ~600px early.
function AutoLoad({ onLoad, loading }: { onLoad: () => void; loading: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const load = useRef(onLoad);
  useEffect(() => { load.current = onLoad; });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let root: HTMLElement | null = el.parentElement;
    while (root && !/(auto|scroll)/.test(getComputedStyle(root).overflowY)) root = root.parentElement;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) load.current(); },
      { root, rootMargin: '0px 0px 600px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className="flex justify-center py-4" aria-hidden={!loading}>
      {loading && <span className="block w-5 h-5 rounded-full border-2 border-white/15 border-t-white/70 animate-spin" />}
    </div>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-3 mb-2.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-white/60">{children}</span>
      <span className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
    </div>
  );
}

// The list: the newest story as the lead card, then the rest by day on a
// timeline. Polled while open; a story
// that was not there at first load rises in with the comment thread's flash,
// in place of the live banner that sits over the map.
// `lead`: the newest story as a big card on top (desktop, where there is room
// for it). Off on mobile, where the sheet is narrow and the list itself is
// what the reader came for - every story is then a row of its day.
export function NewsList({ lead: withLead = true }: { lead?: boolean }) {
  const { locale } = useI18n();
  const { country, roles } = useFilters();
  const q = useNewsList(true);
  const items = q.data?.pages.flatMap((p) => p.items) ?? [];

  // Ids on screen at first load; anything newer arrived live. Taken again
  // when the filters change the list.
  const listKey = `${country ?? ''}|${roles.join(',')}|${locale}`;
  const [seen, setSeen] = useState<{ key: string; ids: Set<string> } | null>(null);
  if (q.data && seen?.key !== listKey) setSeen({ key: listKey, ids: new Set(items.map((n) => n.id)) });
  const arrived = (id: string) => seen?.key === listKey && !seen.ids.has(id);

  if (q.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <span className="block w-6 h-6 rounded-full border-2 border-white/15 border-t-white/70 animate-spin" />
      </div>
    );
  }
  if (!items.length) {
    return (
      <div className="flex flex-col items-center text-center py-16 activity-row-in">
        <span className="w-14 h-14 rounded-full bg-white/[0.05] ring-1 ring-white/10 flex items-center justify-center text-white/40 mb-3">
          <NewsIcon className="w-7 h-7" />
        </span>
        <p className="text-sm text-white/60">{NEWS_COPY.empty}</p>
      </div>
    );
  }

  const lead = withLead ? items[0] : null;
  const rest = withLead ? items.slice(1) : items;
  // Each day's first row continues the stagger where the previous day ended.
  const groups = groupByDay(rest, locale).reduce<{ label: string; items: NewsItem[]; startIndex: number }[]>(
    (acc, g) => [...acc, { ...g, startIndex: acc.length ? acc.at(-1)!.startIndex + acc.at(-1)!.items.length : 1 }],
    [],
  );
  return (
    <div className="space-y-7">
      {lead && (
        <section>
          <SectionLabel>{NEWS_COPY.latest}</SectionLabel>
          <NewsCard key={lead.id} news={lead} lead arrived={arrived(lead.id)} />
        </section>
      )}
      {groups.map((g) => (
        <section key={g.label}>
          <SectionLabel>{g.label}</SectionLabel>
          <Timeline items={g.items} locale={locale} arrived={arrived} startIndex={g.startIndex} />
        </section>
      ))}
      {q.hasNextPage ? (
        <AutoLoad onLoad={() => { if (!q.isFetchingNextPage) q.fetchNextPage(); }} loading={q.isFetchingNextPage} />
      ) : (
        <p className="flex items-center gap-3 text-xs text-white/50">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
          {NEWS_COPY.end}
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
        </p>
      )}
    </div>
  );
}
