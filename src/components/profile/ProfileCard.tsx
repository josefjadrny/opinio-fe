import { useCallback, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import type { Profile } from '../../types/profile';
import { RoleBadge } from '../common/RoleBadge';
import { HoverTip } from '../common/HoverTip';
import { useFilters } from '../../context/useFilters';
import { useIsMobile } from '../../hooks/useIsMobile';
import { formatNumber } from '../../utils/formatNumber';
import { useProfileText } from '../../hooks/useProfileText';
import { useI18n } from '../../i18n/I18nContext';
import { plural } from '../../i18n/pollStrings';
import { CommentCount } from '../comments/CommentCount';
import { PollThumb } from '../poll/PollThumb';
import { PollPreview } from '../poll/PollPreview';

// Hover dwell before the preview opens (ms): responsive, but no flashing while
// the pointer sweeps down a list.
const OPEN_DELAY = 150;

interface ProfileCardProps {
  profile: Profile;
  /** Mobile feed: smaller picture and type. */
  dense?: boolean;
  rank?: number;
}

// A poll in a list: the question only, clamped at 3 lines, plus one meta line
// (category, votes, comments). No description, no answers, no voting here -
// the card's job is to get the poll opened (POLLS-DESIGN.md section 8). Three
// lines, not two: a 50-char English question takes up to two phone lines and its
// German or Czech translation (up to ~1.8x longer) needs the third. On
// desktop a hover opens PollPreview beside the card.
export function ProfileCard({ profile, dense = false, rank }: ProfileCardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const { toggleRole } = useFilters();
  const { locale, t, p } = useI18n();
  const { name } = useProfileText(profile);

  // Desktop hover preview (PollPreview). The open timer is armed once, not
  // restarted on every move, so a moving pointer still opens it; leaving the
  // card waits a beat so the pointer can cross into the panel.
  const cardRef = useRef<HTMLDivElement>(null);
  const [previewAnchor, setPreviewAnchor] = useState<HTMLElement | null>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const leaveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const overPreview = useRef(false);
  const closePreview = useCallback(() => {
    clearTimeout(openTimer.current);
    clearTimeout(leaveTimer.current);
    openTimer.current = undefined;
    overPreview.current = false;
    setPreviewAnchor(null);
  }, []);
  const armPreview = useCallback(() => {
    if (isMobile || dense) return;
    clearTimeout(leaveTimer.current);
    if (previewAnchor || openTimer.current) return;
    openTimer.current = setTimeout(() => { openTimer.current = undefined; setPreviewAnchor(cardRef.current); }, OPEN_DELAY);
  }, [isMobile, dense, previewAnchor]);
  const leaveCard = useCallback(() => {
    clearTimeout(openTimer.current);
    openTimer.current = undefined;
    leaveTimer.current = setTimeout(() => { if (!overPreview.current) setPreviewAnchor(null); }, 150);
  }, []);

  // `comments` lands the poll on its thread (desktop tab / mobile sheet).
  const openDetail = useCallback((comments = false) => {
    // The preview portal sits above the detail window; drop it first.
    closePreview();
    // Seed the detail cache with what the card has, so the page paints at once;
    // the detail query fills in results and the caller's vote.
    // Marked stale (updatedAt 0) so the detail still fetches at once.
    if (!queryClient.getQueryData(['profile', profile.id, locale])) {
      queryClient.setQueryData(['profile', profile.id, locale], profile, { updatedAt: 0 });
    }
    navigate('/p/' + profile.id + location.search, comments ? { state: { comments: true } } : undefined);
  }, [navigate, profile, location.search, queryClient, locale, closePreview]);

  const openComments = useCallback((e: React.MouseEvent) => { e.stopPropagation(); openDetail(true); }, [openDetail]);

  const handleRoleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toggleRole(profile.role);
  }, [profile.role, toggleRole]);

  // Desktop: the category chip filters. Mobile: decorative, the tap opens the poll.
  const roleEl = isMobile ? (
    <RoleBadge role={profile.role} />
  ) : (
    <HoverTip label={`${t.filterBy}: ${t.roles[profile.role]}`}>
      <span role="button" tabIndex={0} onClick={handleRoleClick} className="cursor-pointer hover:opacity-70 transition-opacity">
        <RoleBadge role={profile.role} />
      </span>
    </HoverTip>
  );

  return (
    <div
      ref={cardRef}
      role="link"
      tabIndex={0}
      onMouseEnter={armPreview}
      onMouseMove={armPreview}
      onMouseLeave={leaveCard}
      onClick={() => openDetail()}
      onKeyDown={(e) => { if (e.key === 'Enter') openDetail(); }}
      className={`group relative flex items-start rounded-xl bg-surface-light/40 ring-1 ring-white/[0.06] hover:ring-white/15 hover:bg-surface-light/70 transition-all duration-200 cursor-pointer select-none ${
        dense ? 'gap-2.5 px-2.5 py-2' : 'gap-3 px-3 py-2.5'
      }`}
    >
      {rank != null && (
        <span className="shrink-0 mt-0.5 text-[11px] font-semibold tabular-nums text-text-secondary bg-white/[0.06] rounded-md px-1.5 py-0.5 leading-none">
          {rank}
        </span>
      )}
      <PollThumb role={profile.role} imageUrl={profile.imageUrl} className={dense ? 'w-11 h-11' : 'w-14 h-14'} />
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-white leading-snug line-clamp-3 break-words ${dense ? 'text-[15px]' : 'text-[15px] lg:text-base'}`}>
          {name}
        </p>
        <div className="flex items-center gap-2 mt-1 min-w-0">
          {roleEl}
          <span className="text-[13px] text-text-secondary tabular-nums whitespace-nowrap">
            {plural(p.votes, locale, profile.voteCount, formatNumber)}
          </span>
          <span className="ml-auto flex items-center">
            <CommentCount count={profile.commentCount ?? 0} size={dense ? 'xs' : 'sm'} onClick={openComments} />
          </span>
        </div>
      </div>
      {previewAnchor && (
        <PollPreview
          profile={profile}
          anchorEl={previewAnchor}
          onMouseEnter={() => { overPreview.current = true; clearTimeout(leaveTimer.current); }}
          onMouseLeave={closePreview}
        />
      )}
    </div>
  );
}
