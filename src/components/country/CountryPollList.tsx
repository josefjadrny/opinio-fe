import { useEffect, useMemo, useRef } from 'react';
import type { CountryPollItem } from '../../types/api';
import { useCountryPollsInfinite } from '../../hooks/useCountryPolls';
import { useI18n } from '../../i18n/I18nContext';
import { PollThumb } from '../poll/PollThumb';
import { CountrySplit } from './CountrySplit';
import { countryRows, splitLabel } from '../../utils/split';
import { StatTip } from '../common/StatTip';
import { SplitList } from '../poll/SplitList';

// The country's result (CountrySplit, as on the map hover); hovering or
// tapping the bar line opens the split spelled out - the poll detail's votes-tile pattern. The tap opens the
// popup only, it does not open the poll (StatTip stops the click).
function CountryResult({ item }: { item: CountryPollItem }) {
  const rows = countryRows(item);
  const total = item.country.total;
  if (total === 0) return null;
  const shown = rows.filter((r) => r.n > 0);
  return (
    <CountrySplit
      item={item}
      bar={(line) => (
        <StatTip
          label={splitLabel(shown, total)}
          width={260}
          className="relative z-10 block w-full text-left py-1 -my-1"
          panel={<SplitList rows={shown} total={total} />}
        >
          {line}
        </StatTip>
      )}
    />
  );
}

// "What {country} answers": the polls people from this country voted on, most
// voted first, each with how this country answered it (POLLS-DESIGN.md
// section 8 "Country page"). Pages of 20 load as the reader nears the end.
export function CountryPollList({ code, countryName, onOpen }: { code: string; countryName: string; onOpen: (id: string) => void }) {
  const { p } = useI18n();
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useCountryPollsInfinite(code);

  // "top" leans on the last 24h, so a poll can move across a page boundary
  // between two loads; keep its first appearance only.
  const items = useMemo(() => {
    const seen = new Set<string>();
    const out: CountryPollItem[] = [];
    for (const page of data?.pages ?? []) {
      for (const it of page.items) {
        if (seen.has(it.poll.id)) continue;
        seen.add(it.poll.id);
        out.push(it);
      }
    }
    return out;
  }, [data]);

  // The sentinel sits under the last card. IntersectionObserver respects the
  // scrolling ancestor's clip, so the default root (the viewport) works inside
  // the modal's own scroller; the margin starts the next page a little early.
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && !isFetchingNextPage) fetchNextPage();
    }, { rootMargin: '0px 0px 300px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, items.length]);

  if (isLoading && items.length === 0) {
    return <p className="text-sm text-white/50 py-4 text-center">...</p>;
  }
  if (items.length === 0) {
    return <p className="text-sm text-white/50 py-4 text-center">{p.countryNoPolls.replace('{country}', countryName)}</p>;
  }

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {items.map((it) => (
          // A real link for crawlers, middle-click and long-press: the question
          // is an <a href> whose ::after covers the whole card (a "stretched
          // link"), so the card is one link without wrapping the bar's popup
          // button in it - a button inside an <a> is invalid. A plain click
          // stays in-app (onOpen keeps the query and the back-to-country state).
          <div
            key={it.poll.id}
            className="relative flex items-stretch gap-3 rounded-xl bg-surface-light/40 ring-1 ring-white/[0.06] hover:ring-white/15 hover:bg-surface-light/60 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-accent/60 p-2 cursor-pointer transition-all"
          >
            {/* The full image where there is one - the 128px thumb is soft on
                a retina screen. Lazy, since a long country list is 20 per page. */}
            <PollThumb
              role={it.poll.role}
              imageUrl={it.poll.contentImageUrl ?? it.poll.imageUrl}
              className="w-16 h-16 rounded-xl"
            />
            <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
              <a
                href={`/p/${it.poll.id}`}
                onClick={(e) => {
                  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                  e.preventDefault();
                  onOpen(it.poll.id);
                }}
                className="text-sm font-semibold text-white leading-snug line-clamp-2 focus:outline-none after:absolute after:inset-0 after:rounded-xl"
              >
                {it.poll.name}
              </a>
              <CountryResult item={it} />
            </div>
          </div>
        ))}
      </div>
      {hasNextPage && (
        <div ref={sentinelRef} className="py-3 text-center text-sm text-white/50" aria-hidden>
          {isFetchingNextPage ? '...' : ''}
        </div>
      )}
    </div>
  );
}
