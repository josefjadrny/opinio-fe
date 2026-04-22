import type { Profile } from '../../types/profile';
import { useI18n } from '../../i18n/I18nContext';
import { ProfileCard } from '../profile/ProfileCard';

interface SidebarProps {
  title: string;
  profiles: Profile[];
  recentlyAdded: Profile[];
  accentColor: 'positive' | 'negative';
}

function interleave(
  ranked: Profile[],
  recent: Profile[],
): Array<{ profile: Profile; isNew: boolean }> {
  const result = ranked.map((p) => ({ profile: p, isNew: false }));
  const insertPositions = [2, 6];

  recent.forEach((profile, i) => {
    const pos = insertPositions[i];
    if (pos !== undefined && pos <= result.length) {
      result.splice(pos, 0, { profile, isNew: true });
    }
  });

  return result;
}

export function Sidebar({ title, profiles, recentlyAdded, accentColor }: SidebarProps) {
  const { t } = useI18n();
  const items = interleave(profiles, recentlyAdded);
  const borderClass = accentColor === 'positive' ? 'border-l-2 border-positive' : 'border-r-2 border-negative';
  const textColor = accentColor === 'positive' ? 'text-positive' : 'text-negative';

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
      <div className="flex-1 overflow-y-auto no-scrollbar px-1 py-1.5 space-y-1">
        {items.map(({ profile }) => (
          <ProfileCard
            key={profile.id}
            profile={profile}
            variant="default"
            reverseVotes={accentColor === 'negative'}
          />
        ))}
        {items.length === 0 && (
          <p className="text-center text-text-secondary text-sm py-8">{t.noProfiles}</p>
        )}
      </div>
    </div>
  );
}
