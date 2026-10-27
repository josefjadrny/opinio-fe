import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMe } from '../../hooks/useMe';
import { useI18n } from '../../i18n/I18nContext';
import { useIsMobile } from '../../hooks/useIsMobile';
import { HeaderButton } from '../ui/HeaderButton';
import { HoverTip } from '../common/HoverTip';
import { ModalShell } from '../common/ModalShell';
import { useSignIn } from '../auth/SignInContext';
import { NotificationList, BellIcon } from './NotificationList';
import { WASH } from '../common/wash';
import type { NotificationItem } from '../../types/api';

interface NotificationBellProps {
  onOpen?: () => void;
}

// The header bell: the unseen count rides /api/me's 10s poll; the panel is a
// dropdown on desktop and a sheet on mobile. Anonymous visitors get it
// disabled with the sign-in line, like add-opinio: a hover tip on desktop,
// and on mobile (no hover to explain a dead control) a tap opens sign-in.
export function NotificationBell({ onOpen }: NotificationBellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();
  const isMobile = useIsMobile();
  const { promptSignIn } = useSignIn();
  const { data: me, isLoading } = useMe();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isAnonymous = !me?.user || me.user.tier === 'anonymous';
  const unseen = isAnonymous ? 0 : (me?.unseenNotifications ?? 0);

  // Desktop dropdown: an outside click or Escape closes it. The mobile sheet
  // has its own backdrop and Escape handling (ModalShell).
  useEffect(() => {
    if (!open || isMobile) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    // Captured on window and stopped: an open opinio modal underneath closes
    // on Escape from its own document listener, and one Escape should close
    // only the topmost thing.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey, true);
    };
  }, [open, isMobile]);

  // Any navigation closes the panel - a row click, the back button, or a
  // ProfileMenu entry tapped while the mobile sheet is up. Adjusted during
  // render (React's "state from a changing prop"), not in an effect.
  const [routeKey, setRouteKey] = useState(location.key);
  if (routeKey !== location.key) {
    setRouteKey(location.key);
    if (open) setOpen(false);
  }
  // Signing out with the panel open.
  if (open && isAnonymous) setOpen(false);

  if (isLoading) return null;

  const toggle = () => {
    if (isAnonymous) {
      if (isMobile) promptSignIn();
      return;
    }
    const next = !open;
    setOpen(next);
    if (next) onOpen?.();
  };

  // Milestone lines open the opinio on its country view (the default),
  // comment lines on its thread; support lines open the support window on
  // their ticket.
  const openProfile = (item: NotificationItem) => {
    setOpen(false);
    if (item.ticket) {
      navigate('/support' + location.search, { state: { ticketId: item.ticket.id } });
      return;
    }
    if (item.profile) {
      navigate('/p/' + item.profile.id + location.search, item.kind === 'comment' ? { state: { comments: true } } : undefined);
    }
  };

  const badge = unseen > 0 && (
    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-white text-[10px] font-bold leading-[18px] text-center ring-2 ring-surface pointer-events-none">
      {unseen > 99 ? '99+' : unseen}
    </span>
  );

  return (
    <div className="relative" ref={ref}>
      <HoverTip label={isAnonymous ? t.notificationsSignIn : open ? null : t.notifications}>
        <HeaderButton
          shape="circle"
          active={open}
          // Disabled only where a hover can explain it; mobile keeps the tap.
          disabled={isAnonymous && !isMobile}
          onClick={toggle}
          aria-label={unseen > 0 ? `${t.notifications} (${unseen > 99 ? '99+' : unseen})` : t.notifications}
          aria-expanded={isAnonymous ? undefined : open}
          className={`relative ${isAnonymous && isMobile ? 'opacity-30' : ''}`}
        >
          <BellIcon className="w-6 h-6 md:w-7 md:h-7 shrink-0" />
          {badge}
        </HeaderButton>
      </HoverTip>

      {open && !isMobile && (
        // z-[85]: the ProfileMenu's level - above an open ModalShell (z-80).
        // Grows with the screen: 400px wide up to ~1660px, a quarter of the
        // width above it (640px cap), and up to 3/4 of the height (600px
        // floor), never past the bottom edge.
        <div className="absolute right-0 top-full mt-2 w-[clamp(400px,24vw,640px)] bg-surface border border-border rounded-2xl shadow-2xl shadow-black/50 z-[85] flex flex-col max-h-[min(max(600px,75vh),calc(100vh-6rem))]" style={{ animation: 'modal-enter 0.2s ease-out' }}>
          <div className="user-header-wash flex items-center gap-2.5 px-4 py-3 border-b border-border shrink-0 rounded-t-2xl" style={WASH}>
            <span className="w-9 h-9 rounded-full bg-white/[0.07] ring-1 ring-white/15 flex items-center justify-center shrink-0">
              <BellIcon className="w-[22px] h-[22px]" />
            </span>
            <h2 className="text-base font-semibold text-white">{t.notifications}</h2>
          </div>
          <div className="overflow-y-auto overscroll-y-contain subtle-scrollbar p-2">
            <NotificationList onOpenProfile={openProfile} />
          </div>
        </div>
      )}
      {open && isMobile && (
        <ModalShell onClose={() => setOpen(false)} title={t.notifications} icon={<BellIcon className="w-5 h-5" />}>
          <div className="p-3">
            <NotificationList onOpenProfile={openProfile} />
          </div>
        </ModalShell>
      )}
    </div>
  );
}
