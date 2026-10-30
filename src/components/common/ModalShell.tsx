import { useEffect, type ReactNode } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useSheetDrag } from '../../hooks/useSheetDrag';
import { useI18n } from '../../i18n/I18nContext';
import { HoverTip } from './HoverTip';
import { WASH } from './wash';

interface ModalShellProps {
  onClose: () => void;
  title: string;
  // Heading level for the title. Page-level modals (routes like /about, /stats)
  // pass 'h1' so the page owns a single top-level heading; stacked sub-dialogs
  // (confirm, report) keep the default 'h2' to avoid a second h1 on the page.
  titleAs?: 'h1' | 'h2';
  icon: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
  desktopScrollable?: boolean;
  centered?: boolean;
  // The notifications panel's look: the brand wash behind the header, the
  // icon in a disc, and a fade-and-rise entrance over a fading backdrop.
  // Every window has it; false is the plain shell.
  panel?: boolean;
  // A window opened from the header (the bell) over whatever window the route
  // has up: z-[85], the ProfileMenu's level. At the shared z-[80] it loses on
  // DOM order alone - FilterBar renders before the router Outlet - and opens
  // behind an open story or opinio, so a tap seems to do nothing.
  above?: boolean;
}

export function ModalShell({
  onClose,
  title,
  titleAs = 'h2',
  icon,
  children,
  footer,
  maxWidth = 'max-w-sm',
  desktopScrollable = false,
  centered = false,
  panel = true,
  above = false,
}: ModalShellProps) {
  const layer = above ? 'z-[85]' : 'z-[80]';
  const TitleTag = titleAs;
  const isMobile = useIsMobile();
  const { t } = useI18n();
  const { sheetRef, dragHandlers } = useSheetDrag(onClose);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const headerWash = panel ? 'user-header-wash' : '';
  const headerIcon = panel ? (
    <span className="w-9 h-9 rounded-full bg-white/[0.07] ring-1 ring-white/15 flex items-center justify-center shrink-0 [&>svg]:w-[22px] [&>svg]:h-[22px]">
      {icon}
    </span>
  ) : icon;

  const closeBtn = (
    <HoverTip label={t.close}>
      <button
        onClick={onClose}
        aria-label={t.close}
        className="text-white/40 hover:text-white/80 transition-colors p-1"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </HoverTip>
  );

  if (isMobile) {
    return (
      // max-h-full, not a vh figure: on mobile Chrome vh is the LARGE viewport
      // (it ignores the retractable URL bar) while this container is sized by
      // the dynamic one, so an 85vh panel could be taller than the box holding
      // it and overflow upward past safe-sheet-top - straight over the header
      // it is supposed to leave alone. Bounding it by the container instead
      // makes the offset above the only thing that decides where it starts.
      <div
        className={`safe-sheet-top fixed inset-x-0 bottom-0 ${layer} flex flex-col justify-end`}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="absolute inset-0 bg-black/60" onClick={onClose} style={panel ? { animation: 'backdrop-in 0.2s ease-out' } : undefined} />
        <div ref={sheetRef} className={`safe-bottom-sheet relative bg-surface border-t border-border rounded-t-2xl shadow-2xl max-h-full flex flex-col ${panel ? 'shadow-black/50' : ''}`} style={panel ? { animation: 'modal-enter 0.2s ease-out' } : undefined}>
          {/* Handle and header share one block so the panel wash runs
              under both without a seam. */}
          <div className={`shrink-0 rounded-t-2xl ${headerWash}`} style={panel ? WASH : undefined}>
            <div className="flex justify-center pt-3 pb-1" {...dragHandlers}>
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-6 py-3 border-b border-border" {...dragHandlers}>
              <div className={`flex items-center ${panel ? 'gap-2.5' : 'gap-2'}`}>
                {headerIcon}
                <TitleTag className="text-base font-semibold text-white">{title}</TitleTag>
              </div>
              {closeBtn}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-y-contain">
            {children}
          </div>
          {footer && (
            <div className="shrink-0 px-6 py-4 border-t border-border">
              {footer}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 ${layer} flex justify-center bg-black/50 ${centered ? 'items-center' : 'items-start pt-12'}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={panel ? { animation: 'backdrop-in 0.2s ease-out' } : undefined}
    >
      <div
        className={`bg-surface border border-border rounded-2xl shadow-2xl w-full ${maxWidth} mx-4 ${desktopScrollable || footer ? 'max-h-[80vh] flex flex-col' : ''} ${panel ? 'shadow-black/50' : ''}`}
        style={panel ? { animation: 'modal-enter 0.2s ease-out' } : undefined}
      >
        <div
          className={`flex items-center justify-between px-6 py-4 border-b border-border ${desktopScrollable || footer ? 'shrink-0' : ''} ${panel ? `${headerWash} rounded-t-2xl` : ''}`}
          style={panel ? WASH : undefined}
        >
          <div className={`flex items-center ${panel ? 'gap-2.5' : 'gap-2'}`}>
            {headerIcon}
            <TitleTag className="text-base font-semibold text-white">{title}</TitleTag>
          </div>
          {closeBtn}
        </div>
        {desktopScrollable || footer ? (
          <div className="overflow-y-auto flex-1">{children}</div>
        ) : (
          children
        )}
        {footer && (
          <div className="shrink-0 px-6 py-4 border-t border-border">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
