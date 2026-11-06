import type { Profile } from '../../types/profile';
import type { PollSort } from '../../types/api';
import { useI18n } from '../../i18n/I18nContext';
import { ProfileCard } from '../profile/ProfileCard';
import { OfflineEmptyState } from '../common/Offline';
import { useFlipReorder } from '../../hooks/useFlipReorder';
import { SortIcon } from './Sidebar';

interface MobileFeedProps {
  sort: PollSort;
  onSortChange: (sort: PollSort) => void;
  profiles: Profile[];
  loading?: boolean;
  /** No data and no way to fetch it - offline, or the API is unreachable. */
  unreachable?: boolean;
}

const SORTS: PollSort[] = ['trending', 'new', 'top'];

// One list with the three orders as tabs: title-only cards keep many polls on
// a phone screen, and one list scrolls further than two stacked sections.
export function MobileFeed({ sort, onSortChange, profiles, loading, unreachable }: MobileFeedProps) {
  const { t, p } = useI18n();
  const flipRef = useFlipReorder();
  const label = (s: PollSort) => (s === 'trending' ? p.sortTrending : s === 'new' ? p.sortNew : p.sortTop);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center gap-1 px-2 pt-2 pb-1.5 border-b border-border" role="tablist">
        {SORTS.map((s) => {
          const active = s === sort;
          return (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSortChange(s)}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg py-2 text-[13px] font-bold uppercase tracking-wider transition-colors ${
                active ? 'bg-white/10 text-white' : 'text-white/50'
              }`}
            >
              <SortIcon sort={s} className={`w-4 h-4 ${active ? '' : 'opacity-60'}`} />
              {label(s)}
            </button>
          );
        })}
      </div>
      <div className="safe-feed-pad flex-1 overflow-y-auto overscroll-y-contain">
        {unreachable && profiles.length === 0 ? (
          <OfflineEmptyState />
        ) : (
          <section className="px-1.5 py-2">
            <div key={sort} ref={flipRef} className="flip-compact space-y-1.5">
              {profiles.map((profile) => (
                <div key={profile.id} data-flip-key={profile.id}>
                  <ProfileCard profile={profile} dense />
                </div>
              ))}
            </div>
            {profiles.length === 0 && !loading && (
              <p className="text-center text-text-secondary text-sm py-8">{t.noProfiles}</p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
