import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Avatar } from '../profile/Avatar';
import { useMe } from '../../hooks/useMe';
import { useI18n } from '../../i18n/I18nContext';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { logout } from '../../api/client';
import { FlagImg } from '../common/CountryFlag';
import { HoverTip } from '../common/HoverTip';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useQueryClient } from '@tanstack/react-query';
import { HeaderButton } from '../ui/HeaderButton';
import { useSignIn } from '../auth/SignInContext';
import { SignInIcon } from '../auth/SignInIcon';

interface ProfileMenuProps {
  onOpen?: () => void;
}

export function ProfileMenu({ onOpen }: ProfileMenuProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data: me, isLoading: meLoading } = useMe();
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { promptSignIn } = useSignIn();

  const handleLogout = async () => {
    setOpen(false);
    try {
      await logout();
    } catch {
      // Proceed regardless - cookie may already be gone
    }
    await queryClient.resetQueries({ queryKey: ['me'] });
  };

  const user = me?.user;
  const isAnonymous = !user || user.tier === 'anonymous';
  const displayName = isAnonymous ? t.anonymousUser : (user?.displayName ?? t.anonymousUser);
  const hasCountry = !meLoading && !!user?.countryCode;
  // Offline, /api/me fails and the user looks country-less, which would light
  // up the red "set your country" warning for the wrong reason. Fall back to
  // the neutral state until we can actually ask the server.
  const online = useOnlineStatus();
  // The flag is sized in px, not classes, so the md step the disc takes has to
  // be read here - the hook's default breakpoint IS Tailwind's md.
  const isMobile = useIsMobile();
  const profileButtonLabel = isAnonymous ? t.profile : `@${displayName}`;
  const showCountryWarning = isAnonymous && !hasCountry && !meLoading && online;

  const goToMyProfile = () => {
    setOpen(false);
    if (user) navigate(`/u/${user.id}` + location.search);
  };

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const toggleMenu = () => { const next = !open; setOpen(next); if (next) onOpen?.(); };

  // The picture, sized to sit in a disc. Declared once because the menu's first
  // row repeats the header button exactly - same face, same frame - so the row
  // you land on reads as the button you just clicked, not a second avatar.
  const discFace = isAnonymous
    ? hasCountry
      ? <FlagImg code={user!.countryCode!} size={isMobile ? 22 : 26} />
      : <Avatar name={displayName} imageUrl={null} className="w-7 h-7 md:w-8 md:h-8" isAnonymous />
    : <Avatar name={displayName} imageUrl={user?.avatarUrl ?? null} className="w-9 h-9 md:w-10 md:h-10" isAnonymous={false} />;
  const DISC = 'w-10 h-10 md:w-11 md:h-11 rounded-full border border-white/15 bg-white/[0.07] flex items-center justify-center shrink-0';

  return (
    <div className="relative" ref={ref}>
      {/* One 40px disc, the way every social header does it: the identity is
          the picture and the name lives inside the menu. Signed out it is the
          visitor's flag - the country is the one thing we do know about them
          and it is what the vote needs - and the anonymous mask only when we
          have no country, where the missing-country line rides the same tip. */}
      <HoverTip label={showCountryWarning ? t.noCountryWarning : null} className="contents">
        <HeaderButton
          onClick={toggleMenu}
          active={open}
          shape="circle"
          aria-label={profileButtonLabel}
          className={`relative ${showCountryWarning ? 'ring-1 ring-negative/70' : ''}`}
        >
          {discFace}
          <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 md:w-[18px] md:h-[18px] rounded-full bg-surface border border-white/20 flex items-center justify-center">
            <svg className={`w-2.5 h-2.5 md:w-3 md:h-3 text-white/70 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </HeaderButton>
      </HoverTip>

      {/* z-[85]: above an open ModalShell sheet (z-80), below the mobile votes
          bar (z-90) and the lightbox (z-95). The mobile sheet starts at
          safe-sheet-top, so its backdrop never covers the header and this
          button stays tappable while a sheet is open - at equal z-index the
          menu lost to the sheet purely on DOM order (FilterBar renders before
          the router Outlet), so it opened behind it. */}
      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-48 bg-surface border border-border rounded-xl shadow-xl z-[85] py-1 flex flex-col">
          {!isAnonymous && (
            <>
              {/* The header button carries no name any more, so this row is
                  where you read who you are signed in as. The label a screen
                  reader gets is still "my profile" - the handle alone would not
                  say the row is a link to it. */}
              <button
                onClick={goToMyProfile}
                aria-label={t.myProfile}
                className="w-full text-left px-3 py-2.5 hover:bg-white/5 transition-colors flex items-center gap-2.5"
              >
                <span className={DISC}>{discFace}</span>
                <span className="block text-sm font-semibold text-white truncate min-w-0">@{displayName}</span>
              </button>
              <div className="border-t border-border my-1" />
            </>
          )}

          <button
            onClick={() => { setOpen(false); navigate('/settings' + location.search); }}
            className="w-full text-left px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 transition-colors flex items-center gap-2.5"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2}>
              <path stroke="#ef4444" strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke="#22c55e" strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {t.settings}
          </button>

          <button
            onClick={() => { setOpen(false); navigate('/stats' + location.search); }}
            className="w-full text-left px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 transition-colors flex items-center gap-2.5"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2}>
              <path stroke="#ef4444" strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2z" />
              <path stroke="#22c55e" strokeLinecap="round" strokeLinejoin="round" d="M9 19V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {t.stats}
          </button>

          <div className="relative group">
            <button
              onClick={() => { setOpen(false); navigate('/support' + location.search); }}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors flex items-center gap-2.5 ${isAnonymous ? 'text-white/30 cursor-default' : 'text-white/80'}`}
              disabled={isAnonymous}
            >
              {isAnonymous ? (
                <svg className="w-4 h-4 shrink-0 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2}>
                  <path stroke="#ef4444" strokeLinecap="round" strokeLinejoin="round" d="M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  <path stroke="#22c55e" strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01" />
                </svg>
              )}
              {t.support}
            </button>
            {isAnonymous && (
              <div className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-2 px-2.5 py-1.5 rounded-lg bg-surface border border-border shadow-xl text-xs text-white/60 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
                {t.supportSignIn}
              </div>
            )}
          </div>

          <button
            onClick={() => { setOpen(false); navigate('/about' + location.search); }}
            className="w-full text-left px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 transition-colors flex items-center gap-2.5"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2}>
              <path stroke="#ef4444" strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path stroke="#22c55e" strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01" />
            </svg>
            {t.about}
          </button>

          <div className="border-t border-border my-1" />

          {isAnonymous ? (
            <button
              onClick={() => { setOpen(false); promptSignIn(); }}
              className="w-full text-left px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 transition-colors flex items-center gap-2.5"
            >
              <SignInIcon />
              {t.login}
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 transition-colors flex items-center gap-2.5"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2}>
                <path stroke="#22c55e" strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7" />
                <path stroke="#ef4444" strokeLinecap="round" strokeLinejoin="round" d="M13 20v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {t.logout}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
