import { useCallback } from 'react';
import type { Profile } from '../../types/profile';
import { useI18n } from '../../i18n/I18nContext';
import { ProfileCard } from '../profile/ProfileCard';

interface SidebarProps {
  title: string;
  profiles: Profile[];
  accentColor: 'positive' | 'negative';
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
}

export function Sidebar({ title, profiles, accentColor, onLoadMore, isLoadingMore }: SidebarProps) {
  const { t } = useI18n();
  const borderClass = accentColor === 'positive' ? 'border-l-2 border-positive' : 'border-r-2 border-negative';
  const textColor = accentColor === 'positive' ? 'text-positive' : 'text-negative';

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (!onLoadMore) return;
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 120) {
      onLoadMore();
    }
  }, [onLoadMore]);

  return (
    <div className={`flex flex-col h-full min-h-0 ${borderClass}`}>
      <div className="px-3 py-2 border-b border-border">
        <h2 className={`flex items-center justify-center gap-1.5 text-sm font-bold uppercase tracking-wider ${textColor}`}>
          {accentColor === 'positive' ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.306-4.307a11.95 11.95 0 015.814 5.519l2.74 1.22m0 0l-5.94 2.28m5.94-2.28l-2.28-5.941" />
            </svg>
          )}
          {title}
        </h2>
      </div>
      <div onScroll={handleScroll} className="flex-1 overflow-y-auto no-scrollbar px-1 py-1.5 space-y-1">
        {profiles.map((profile) => (
          <ProfileCard
            key={profile.id}
            profile={profile}
            variant="default"
            reverseVotes={accentColor === 'negative'}
          />
        ))}
        {profiles.length === 0 && !isLoadingMore && (
          <p className="text-center text-text-secondary text-sm py-8">{t.noProfiles}</p>
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
