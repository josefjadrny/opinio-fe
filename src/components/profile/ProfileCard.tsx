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
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const hoverTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const leaveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isOverTooltip = useRef(false);
  const isMobile = useIsMobile();
  const { data: breakdown, isLoading: breakdownLoading } = usePersonBreakdown(hoveredId);
  const { setHoveredProfileCountry } = useFilters();

  const openDetail = useCallback(() => {
    queryClient.setQueryData(['profile', profile.id], profile);
    navigate('/p/' + profile.id + location.search);
  }, [navigate, profile, location.search, queryClient]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
    // Only reset the open-delay while the tooltip isn't shown yet — once
    // it's open, mouse movement should not re-arm the timer.
    if (hoveredId == null) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = setTimeout(() => {
        setHoveredId(profile.id);
      }, 750);
    }
  }, [hoveredId, profile.id]);

  const handleMouseEnter = useCallback(() => {
    clearTimeout(leaveTimer.current);
    clearTimeout(hoverTimer.current);
    setHoveredProfileCountry(profile.countryCode);
    hoverTimer.current = setTimeout(() => {
      setHoveredId(profile.id);
    }, 750);
  }, [profile.id, profile.countryCode, setHoveredProfileCountry]);

  const handleMouseLeave = useCallback(() => {
    clearTimeout(hoverTimer.current);
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
          {profile.name}
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
              <span className="text-sm font-medium text-white truncate min-w-0 flex-shrink">{profile.name}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <CountryFlag code={profile.countryCode} />
                <RoleBadge role={profile.role} />
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
            position={mousePos}
            onMouseEnter={handleTooltipEnter}
            onMouseLeave={handleTooltipLeave}
          />
        )}
      </div>
    );
  }

  // default variant
  return (
    <div
      className="flex items-start gap-2.5 px-1.5 py-2 bg-surface-light/50 rounded-xl ring-1 ring-transparent hover:bg-surface-light hover:ring-white/10 transition-all duration-150 select-none"
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={openDetail}
    >
      {rank != null && (
        <span className="text-sm font-bold text-text-secondary w-6 text-right shrink-0 pt-1">
          {rank}
        </span>
      )}
      <Avatar name={profile.name} imageUrl={profile.imageUrl} className="w-10 h-10" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-x-1.5 gap-y-0.5 flex-wrap min-w-0">
          <span className="font-semibold text-white truncate min-w-0 flex-shrink">{profile.name}</span>
          <div className="flex items-center gap-1.5 shrink-0">
            <CountryFlag code={profile.countryCode} />
            <RoleBadge role={profile.role} />
            {profile.label && <LabelBadge label={profile.label} />}
          </div>
        </div>
        <p className="text-[13px] text-text-secondary mb-0.5">{profile.description}</p>
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
      {hoveredId && (
        <PersonTooltip
          profile={profile}
          breakdown={breakdown}
          isLoading={breakdownLoading}
          position={mousePos}
          onMouseEnter={handleTooltipEnter}
          onMouseLeave={handleTooltipLeave}
        />
      )}
    </div>
  );
}
