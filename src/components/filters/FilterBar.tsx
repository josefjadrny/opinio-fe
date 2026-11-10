import { useState } from 'react';
import { NewPollIcon } from '../poll/PollIcons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nContext';
import { RoleFilter } from './RoleFilter';
import { SearchWhisperer } from './SearchWhisperer';
import { MobileFilterSheet } from './MobileFilterSheet';
import { useFilters } from '../../context/useFilters';
import { ProfileMenu } from './ProfileMenu';
import { useMe } from '../../hooks/useMe';
import { HeaderButton } from '../ui/HeaderButton';
import { HoverTip } from '../common/HoverTip';
import { LogoMark } from '../common/LogoMark';
import { NotificationBell } from '../notifications/NotificationBell';

interface FilterBarProps {
  onAddProfile: () => void;
}

// Transient overlays that render *over* the home feed instead of being a page of
// their own: they canonical to "/" and neither passes `titleAs` to ModalShell, so
// neither owns an h1. They must still count as home here - otherwise a first-time
// visitor (which Googlebot is on every crawl, its localStorage always empty) gets
// pushed to /welcome and the home page ends up with no h1 at all.
const HOME_OVERLAY_PATHS = ['/welcome', '/viewer-mode'];

export function FilterBar({ onAddProfile }: FilterBarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();
  // The wordmark is the page h1 only on the home route (bare or locale-prefixed
  // like /cs) and its overlay routes. On every other route the active page owns
  // its own h1, so here the wordmark is just branding (a span) to keep one h1
  // per page.
  const barePath = location.pathname.replace(/^\/(cs|es|de|fr|it|pl)(?=\/|$)/, '').replace(/\/$/, '');
  const isHome = barePath === '' || HOME_OVERLAY_PATHS.includes(barePath);
  const { data: me, isLoading: meLoading } = useMe();
  const isAnonymous = !me?.user || me.user.tier === 'anonymous';
  const { roles, search, clearFilters } = useFilters();
  const hasFilters = !!(roles.length || search);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  // The bell's panel lives here so opening it can close the filter sheet.
  const [bellOpen, setBellOpen] = useState(false);
  const onBellChange = (next: boolean) => {
    setBellOpen(next);
    if (next) setFilterSheetOpen(false);
  };
  // Any navigation closes the panel - a row click, the back button, or a
  // ProfileMenu entry tapped while the mobile sheet is up. Adjusted during
  // render (React's "state from a changing prop"), not in an effect.
  const [routeKey, setRouteKey] = useState(location.key);
  if (routeKey !== location.key) {
    setRouteKey(location.key);
    if (bellOpen) setBellOpen(false);
  }
  // Signing out with the panel open.
  if (bellOpen && isAnonymous) setBellOpen(false);

  return (
    <>
      <div className="safe-top-header flex items-center justify-between gap-3 px-4 py-3 bg-surface border-b border-border">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 mr-2 hover:opacity-80 transition-opacity shrink-0 cursor-pointer"
          >
            {/* The store mark, inline: /favicon.svg is the flat older drawing
                and carries its own dark disc. Desktop takes the bigger pair -
                the 44px discs at the other end left the wordmark looking
                undersized - and still fits inside the header's own height. */}
            <LogoMark className="w-7 h-7 md:w-9 md:h-9 shrink-0" />
            {isHome ? (
              <h1 className="text-xl md:text-2xl font-bold text-accent tracking-tight">{t.appName}</h1>
            ) : (
              <span className="text-xl md:text-2xl font-bold text-accent tracking-tight">{t.appName}</span>
            )}
          </button>
          {/* Desktop filters - md+ only */}
          <div className="hidden md:flex items-center gap-3">
            <RoleFilter />
            <SearchWhisperer variant="desktop" />
            <button
              onClick={clearFilters}
              disabled={!hasFilters}
              className="bg-surface-light text-text-primary/70 text-sm rounded-lg border border-border px-3 py-1.5 whitespace-nowrap focus:outline-none focus:border-accent disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {t.clearFilters}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile filter icon - hidden at md+ */}
          <HeaderButton
            onClick={() => setFilterSheetOpen(true)}
            shape="circle"
            className="relative md:hidden text-positive"
            aria-label="Filters"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            {hasFilters && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-accent" />
            )}
          </HeaderButton>
          {/* Desktop only - mobile drops an opinio from the FAB. Anonymous
              visitors get the disabled disc with the sign-in line on hover
              rather than a modal that only tells them to sign in. */}
          {!meLoading && (
            <HoverTip label={isAnonymous ? t.nominateTooltip : t.addProfileTitle} className="hidden md:inline-flex">
              <HeaderButton
                shape="circle"
                disabled={isAnonymous}
                onClick={() => { setFilterSheetOpen(false); onAddProfile(); }}
                aria-label={t.addProfileTitle}
              >
                <NewPollIcon className="w-6 h-6 md:w-7 md:h-7" />
              </HeaderButton>
            </HoverTip>
          )}
          <NotificationBell open={bellOpen} onOpenChange={onBellChange} />
          <ProfileMenu onOpen={() => setFilterSheetOpen(false)} />
        </div>
      </div>
      {filterSheetOpen && <MobileFilterSheet onClose={() => setFilterSheetOpen(false)} />}
    </>
  );
}
