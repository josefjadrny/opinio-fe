import { useCallback, useRef } from 'react';
import type { Profile } from '../../types/profile';
import type { PollSort } from '../../types/api';
import { useI18n } from '../../i18n/I18nContext';
import { ProfileCard } from '../profile/ProfileCard';
import { OfflineEmptyState } from '../common/Offline';
import { useFlipReorder } from '../../hooks/useFlipReorder';

// Two-tone like every app icon (profile menu, modal headers): the shape in
// the brand red, its accent in the brand green.
const SORT_ICON: Record<PollSort, { red: string; green: string }> = {
  // Rising line, green arrowhead.
  trending: {
    red: 'M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22',
    green: 'M21.86 8.818l-5.94-2.28M21.86 8.818l-2.28 5.941',
  },
  // Clock face, green hands.
  new: {
    red: 'M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    green: 'M12 6v6l4 2',
  },
  // Trophy cup, green base.
  top: {
    red: 'M14.504 14.25a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0',
    green: 'M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497',
  },
};

export function SortIcon({ sort, className = 'w-4 h-4' }: { sort: PollSort; className?: string }) {
  const { red, green } = SORT_ICON[sort];
  return (
    <svg className={`shrink-0 ${className}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} aria-hidden>
      <path className="stroke-negative" strokeLinecap="round" strokeLinejoin="round" d={red} />
      <path className="stroke-positive" strokeLinecap="round" strokeLinejoin="round" d={green} />
    </svg>
  );
}

interface SidebarProps {
  /** The orders this column offers; one = a plain heading, more = tabs. */
  sorts: PollSort[];
  sort: PollSort;
  onSortChange?: (sort: PollSort) => void;
  profiles: Profile[];
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  /** No data and no way to fetch it - offline, or the API is unreachable. */
  unreachable?: boolean;
}

// A feed column. The headings are neutral (no green/red framing): with
// like/dislike gone, the columns are orders, not sides.
export function Sidebar({ sorts, sort, onSortChange, profiles, onLoadMore, isLoadingMore, unreachable }: SidebarProps) {
  const { t, p } = useI18n();
  const label = (s: PollSort) => (s === 'trending' ? p.sortTrending : s === 'new' ? p.sortNew : p.sortTop);

  // Browsers restore scroll position on F5, which fires onScroll right after
  // the list mounts and would otherwise immediately trip load-more. Only honor
  // scroll once the user has actually interacted with the pane.
  const userScrolledRef = useRef(false);
  const markUserScrolled = useCallback(() => { userScrolledRef.current = true; }, []);
  const flipRef = useFlipReorder();

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (!onLoadMore || !userScrolledRef.current) return;
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 120) {
      onLoadMore();
    }
  }, [onLoadMore]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-3 py-2 border-b border-border">
        <h2 className="flex items-center justify-center gap-1">
          {sorts.map((s) => {
            const active = s === sort;
            const cls = `inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-bold uppercase tracking-wider transition-colors ${
              active ? 'text-white' : 'text-white/50 hover:text-white/80'
            } ${active && sorts.length > 1 ? 'bg-white/10' : ''}`;
            return sorts.length > 1 ? (
              <button key={s} type="button" onClick={() => onSortChange?.(s)} aria-pressed={active} className={cls}>
                <SortIcon sort={s} />{label(s)}
              </button>
            ) : (
              <span key={s} className={cls}><SortIcon sort={s} />{label(s)}</span>
            );
          })}
        </h2>
      </div>
      <div
        onScroll={handleScroll}
        onWheel={markUserScrolled}
        onTouchStart={markUserScrolled}
        onKeyDown={markUserScrolled}
        className="flex-1 overflow-y-auto no-scrollbar px-1.5 py-1.5"
      >
        <div key={sort} ref={flipRef} className="space-y-1.5">
          {profiles.map((profile) => (
            <div key={profile.id} data-flip-key={profile.id}>
              <ProfileCard profile={profile} />
            </div>
          ))}
        </div>
        {profiles.length === 0 && !isLoadingMore && (
          unreachable
            ? <OfflineEmptyState />
            : <p className="text-center text-text-secondary text-sm py-8">{t.noProfiles}</p>
        )}
        {isLoadingMore && (
          <div className="flex justify-center py-3">
            <span className="block w-5 h-5 rounded-full border-2 border-white/15 border-t-white/70 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
