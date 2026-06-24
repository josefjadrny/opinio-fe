import { Avatar } from './Avatar';
import { CountryFlag } from '../common/CountryFlag';
import { RoleBadge } from '../common/RoleBadge';
import { VoteButtons } from '../voting/VoteButtons';
import type { Role } from '../../types/profile';

// Minimal structural shape shared by Profile and UserProfileSummary - enough to
// render a list row. Both the country-detail and user-detail modals feed their
// rows through here so the two lists stay visually identical.
export interface ProfileListEntry {
  id: string;
  name: string;
  role: Role;
  imageUrl: string | null;
  countryCode: string;
  description: string;
  likes: number;
  dislikes: number;
}

export function ProfileListRow({ profile, onOpen }: { profile: ProfileListEntry; onOpen: () => void }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } }}
      className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg ring-1 ring-transparent hover:bg-surface-light hover:ring-white/10 transition-all duration-150 cursor-pointer"
    >
      <Avatar name={profile.name} imageUrl={profile.imageUrl} className="w-9 h-9 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-x-1.5 gap-y-0.5 flex-wrap">
          <span className="font-semibold text-white truncate min-w-0 flex-shrink">{profile.name}</span>
          <CountryFlag code={profile.countryCode} />
          <RoleBadge role={profile.role} />
        </div>
        {/* Description hidden on mobile, shown on desktop (>= md). */}
        <p className="hidden md:block text-[13px] text-text-secondary truncate">{profile.description}</p>
      </div>
      <div className="shrink-0">
        <VoteButtons
          profileId={profile.id}
          likes={profile.likes}
          dislikes={profile.dislikes}
          reverseVotes={profile.dislikes > profile.likes}
        />
      </div>
    </div>
  );
}

interface ProfileListProps {
  profiles: ProfileListEntry[];
  label: string;
  emptyText: string;
  onOpen: (id: string) => void;
  // Appended to the header as " (n)" when > 0 (user detail shows a count).
  count?: number;
  // While loading with no rows yet, show loadingText instead of emptyText.
  loading?: boolean;
  loadingText?: string;
}

export function ProfileList({ profiles, label, emptyText, onOpen, count, loading, loadingText }: ProfileListProps) {
  // Wrapped in a single element (not a fragment) so a parent's space-y can't
  // open a gap between the header and the list - the header's own pb controls it.
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40 px-3 pb-2">
        {label}{typeof count === 'number' && count > 0 ? ` (${count})` : ''}
      </p>
      {loading && profiles.length === 0 ? (
        <p className="text-sm text-white/30 py-4 text-center">{loadingText ?? emptyText}</p>
      ) : profiles.length === 0 ? (
        <p className="text-sm text-white/30 py-4 text-center">{emptyText}</p>
      ) : (
        <div className="space-y-1">
          {profiles.map((p) => (
            <ProfileListRow key={p.id} profile={p} onOpen={() => onOpen(p.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
