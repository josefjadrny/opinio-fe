import { useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import type { Profile } from '../../types/profile';
import { RoleBadge } from '../common/RoleBadge';
import { CountryFlag } from '../common/CountryFlag';
import { VoteButtons } from '../voting/VoteButtons';
import { LabelBadge } from './LabelBadge';
import { PersonTooltip } from './PersonTooltip';
import { usePersonBreakdown } from '../../hooks/usePersonBreakdown';
import { useFilters } from '../../context/useFilters';
import { useIsMobile } from '../../hooks/useIsMobile';
import { Avatar } from './Avatar';
import { formatNumber } from '../../utils/formatNumber';
import { useProfileText } from '../../hooks/useProfileText';
import { useI18n } from '../../i18n/I18nContext';
import { getCountryName } from '../../utils/countries';

// Hover dwell before the popup opens (ms). Short enough to feel responsive,
// long enough not to flash while sweeping the pointer across the list.
const OPEN_DELAY = 150;

interface ProfileCardProps {
  profile: Profile;
  variant?: 'default' | 'compact' | 'tooltip';
  rank?: number;
  showOnly?: 'like' | 'dislike';
  reverseVotes?: boolean;
}

export function ProfileCard({ profile, variant = 'default', rank, showOnly, reverseVotes }: ProfileCardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const leaveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isOverTooltip = useRef(false);
  const isMobile = useIsMobile();
  const { data: breakdown, isLoading: breakdownLoading } = usePersonBreakdown(hoveredId);
  const { setHoveredProfileCountry, setCountry, toggleRole } = useFilters();
  const { locale, t } = useI18n();
  // Cards show the translated text but no "see original" toggle — that lives
  // only in the profile detail modal.
  const { name, description } = useProfileText(profile);

  const openDetail = useCallback(() => {
    // Dismiss the hover popup so it doesn't sit on top of the detail modal
    // (the tooltip portal is z-[9999], above the modal).
    clearTimeout(hoverTimer.current);
    clearTimeout(leaveTimer.current);
    hoverTimer.current = undefined;
    isOverTooltip.current = false;
    setHoveredId(null);
    setHoveredProfileCountry(undefined);
    queryClient.setQueryData(['profile', profile.id, locale], profile);
    navigate('/p/' + profile.id + location.search);
  }, [navigate, profile, location.search, queryClient, locale, setHoveredProfileCountry]);

  // Arm the open timer once. Crucially we do NOT reset it on every mouse move —
  // continuous movement used to perpetually restart the timer so the popup only
  // appeared if the pointer held still for the full delay.
  const scheduleOpen = useCallback(() => {
    if (hoveredId != null) return; // already open
    if (hoverTimer.current) return; // already armed
    hoverTimer.current = setTimeout(() => {
      hoverTimer.current = undefined;
      setHoveredId(profile.id);
    }, OPEN_DELAY);
  }, [hoveredId, profile.id]);

  const handleMouseEnter = useCallback(() => {
    clearTimeout(leaveTimer.current);
    setHoveredProfileCountry(profile.countryCode);
    scheduleOpen();
  }, [scheduleOpen, profile.countryCode, setHoveredProfileCountry]);

  const handleMouseMove = useCallback(() => {
    scheduleOpen();
  }, [scheduleOpen]);

  // Desktop only: clicking the flag / role badge applies that filter instead
  // of opening the detail modal.
  const handleCountryClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCountry(profile.countryCode);
  }, [profile.countryCode, setCountry]);

  const handleRoleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toggleRole(profile.role);
  }, [profile.role, toggleRole]);

  // On desktop the flag + role badge become filter shortcuts; on mobile they
  // stay decorative (tap falls through to opening the detail modal).
  const flagEl = isMobile ? (
    <CountryFlag code={profile.countryCode} />
  ) : (
    <span
      role="button"
      tabIndex={0}
      onClick={handleCountryClick}
      title={`${t.filterBy}: ${getCountryName(profile.countryCode)}`}
      className="cursor-pointer rounded hover:opacity-70 transition-opacity"
    >
      <CountryFlag code={profile.countryCode} />
    </span>
  );

  const roleEl = isMobile ? (
    <RoleBadge role={profile.role} />
  ) : (
    <span
      role="button"
      tabIndex={0}
      onClick={handleRoleClick}
      title={`${t.filterBy}: ${t.roles[profile.role]}`}
      className="cursor-pointer hover:opacity-70 transition-opacity"
    >
      <RoleBadge role={profile.role} />
    </span>
  );

  const handleMouseLeave = useCallback(() => {
    clearTimeout(hoverTimer.current);
    hoverTimer.current = undefined;
    setHoveredProfileCountry(undefined);
    leaveTimer.current = setTimeout(() => {
      if (!isOverTooltip.current) setHoveredId(null);
    }, 150);
  }, [setHoveredProfileCountry]);

  const handleTooltipEnter = useCallback(() => {
    isOverTooltip.current = true;
    clearTimeout(leaveTimer.current);
  }, []);

  const handleTooltipLeave = useCallback(() => {
    isOverTooltip.current = false;
    setHoveredId(null);
  }, []);

  if (variant === 'tooltip') {
    // Tooltip wrapper has pointer-events-none, so vote buttons here would be
    // misleading. Render read-only arrow + count instead.
    return (
      <div className="flex items-center gap-2 py-1">
        <Avatar name={profile.name} imageUrl={profile.imageUrl} className="w-6 h-6" />
        <span className="text-xs font-medium text-white truncate flex-1 min-w-0">
          {name}
        </span>
        <div className="flex items-center gap-2 text-xs font-semibold tabular-nums shrink-0">
          <span className="inline-flex items-baseline gap-1 text-positive">
            <span className="text-[10px]">▲</span>
            {formatNumber(profile.likes)}
          </span>
          <span className="inline-flex items-baseline gap-1 text-negative">
            <span className="text-[10px]">▼</span>
            {formatNumber(profile.dislikes)}
          </span>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div
        ref={cardRef}
        className="flex items-center gap-3 px-2 py-2 bg-surface-light/50 rounded-lg ring-1 ring-transparent hover:bg-surface-light hover:ring-white/10 transition-all duration-150 select-none"
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={openDetail}
      >
        {rank != null && (
          <span className="text-xs font-bold text-text-secondary w-5 text-right shrink-0">
            {rank}
          </span>
        )}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Avatar name={profile.name} imageUrl={profile.imageUrl} className="w-8 h-8 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-x-1.5 gap-y-0.5 flex-wrap min-w-0">
              <span className="text-sm font-medium text-white truncate min-w-0 flex-shrink">{name}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                {flagEl}
                {roleEl}
                {profile.label && <LabelBadge label={profile.label} />}
              </div>
            </div>
          </div>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <VoteButtons
            profileId={profile.id}
            likes={profile.likes}
            dislikes={profile.dislikes}
            compact
            showOnly={showOnly}
            reverseVotes={reverseVotes}
          />
        </div>
        {hoveredId && !isMobile && (
          <PersonTooltip
            profile={profile}
            breakdown={breakdown}
            isLoading={breakdownLoading}
            anchorEl={cardRef.current}
            onMouseEnter={handleTooltipEnter}
            onMouseLeave={handleTooltipLeave}
          />
        )}
      </div>
    );
  }

  // default variant — modern card: flat surface, a soft side-coloured glow that
  // fades in on hover, a status dot on the avatar (green on rising / red on
  // falling), and a two-line description.
  const tooltipEl = hoveredId ? (
    <PersonTooltip
      profile={profile}
      breakdown={breakdown}
      isLoading={breakdownLoading}
      anchorEl={cardRef.current}
      onMouseEnter={handleTooltipEnter}
      onMouseLeave={handleTooltipLeave}
    />
  ) : null;

  const side = reverseVotes ? 'negative' : 'positive';
  const glow = side === 'positive' ? 'rgba(34,197,94,0.16)' : 'rgba(239,68,68,0.16)';

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={openDetail}
      className="group relative flex items-start gap-2.5 px-2.5 py-2.5 rounded-xl bg-surface-light/40 ring-1 ring-white/[0.06] hover:ring-white/15 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden select-none"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `radial-gradient(120% 80% at 0% 0%, ${glow}, transparent 60%)` }}
      />
      {rank != null && (
        <span className="relative z-10 shrink-0 mt-0.5 text-[11px] font-semibold tabular-nums text-text-secondary bg-white/[0.06] rounded-md px-1.5 py-0.5 leading-none">
          {rank}
        </span>
      )}
      <Avatar name={profile.name} imageUrl={profile.imageUrl} className="relative z-10 shrink-0 w-10 h-10 ring-2 ring-white/5" />
      <div className="relative z-10 flex-1 min-w-0">
        <div className="flex items-center gap-x-1.5 gap-y-0.5 flex-wrap min-w-0">
          <span className="font-semibold text-white leading-tight break-words min-w-0">{name}</span>
          <div className="flex items-center gap-1.5 shrink-0">
            {flagEl}
            {roleEl}
            {profile.label && <LabelBadge label={profile.label} />}
          </div>
        </div>
        <p className="text-[13px] text-text-secondary leading-snug line-clamp-2 mt-0.5 mb-1.5">{description}</p>
        <div onClick={(e) => e.stopPropagation()}>
          <VoteButtons
            profileId={profile.id}
            likes={profile.likes}
            dislikes={profile.dislikes}
            showOnly={showOnly}
            reverseVotes={reverseVotes}
          />
        </div>
      </div>
      {tooltipEl}
    </div>
  );
}
