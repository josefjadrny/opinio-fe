import { createPortal } from 'react-dom';
import { useLayoutEffect, useRef, useState } from 'react';
import type { Profile } from '../../types/profile';
import { useProfile } from '../../hooks/useProfile';
import { useI18n } from '../../i18n/I18nContext';
import { formatRelativeTime } from '../../utils/formatRelativeTime';
import { ROLE_COLORS } from '../../utils/roles';
import { RoleBadge } from '../common/RoleBadge';
import { PollThumb } from './PollThumb';
import { OptionMark } from './OptionAvatar';
import { PollSummary } from './PollSummary';

const WIDTH = 340;
const GAP = 10; // visible gap between card and panel
const MARGIN = 12; // viewport clamp margin

interface Layout {
  outerLeft: number;
  outerWidth: number;
  panelMarginLeft: number;
  top: number;
  side: 'left' | 'right';
}

interface PollPreviewProps {
  /** The list's copy of the poll - question, picture, answers. */
  profile: Profile;
  anchorEl: HTMLElement | null;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

// Desktop hover preview of a feed card: picture, question, every answer with
// its share, the reach figures and who asked. List rows carry no results, so
// this reads the poll itself - the same query the detail uses, which leaves
// the detail warm for the click that usually follows. Read-only on purpose:
// voting happens in the detail.
export function PollPreview({ profile: listPoll, anchorEl, onMouseEnter, onMouseLeave }: PollPreviewProps) {
  const { t, locale } = useI18n();
  const { data } = useProfile(listPoll.id);
  const profile = data?.results ? data : listPoll;
  const results = data?.results;
  const panelRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<Layout | null>(null);
  const [heroLoaded, setHeroLoaded] = useState(false);

  // Pinned beside the card on the side with room, clamped to the viewport;
  // the outer box bridges the gap so the pointer can cross into the panel.
  useLayoutEffect(() => {
    if (!anchorEl) return;
    const compute = () => {
      const a = anchorEl.getBoundingClientRect();
      const h = panelRef.current?.offsetHeight ?? 360;
      const spaceRight = window.innerWidth - a.right;
      const side: 'left' | 'right' = spaceRight >= WIDTH + GAP + MARGIN || spaceRight >= a.left ? 'right' : 'left';
      let panelLeft = side === 'right' ? a.right + GAP : a.left - WIDTH - GAP;
      panelLeft = Math.max(MARGIN, Math.min(panelLeft, window.innerWidth - WIDTH - MARGIN));
      let outerLeft: number, outerWidth: number, panelMarginLeft: number;
      if (side === 'right') {
        outerLeft = Math.min(a.right, panelLeft);
        outerWidth = panelLeft + WIDTH - outerLeft;
        panelMarginLeft = panelLeft - outerLeft;
      } else {
        outerLeft = panelLeft;
        outerWidth = Math.max(a.left, panelLeft + WIDTH) - panelLeft;
        panelMarginLeft = 0;
      }
      let top = a.top;
      if (top + h > window.innerHeight - MARGIN) top = window.innerHeight - h - MARGIN;
      if (top < MARGIN) top = MARGIN;
      setLayout({ outerLeft, outerWidth, panelMarginLeft, top, side });
    };
    compute();
    window.addEventListener('scroll', compute, true);
    window.addEventListener('resize', compute);
    return () => {
      window.removeEventListener('scroll', compute, true);
      window.removeEventListener('resize', compute);
    };
  }, [anchorEl, results, heroLoaded]);

  const counts = new Map(results?.options.map((o) => [o.optionId, o.n]) ?? []);
  const total = results?.total ?? 0;
  const options = [...profile.options].sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0) || a.position - b.position);
  const leader = total > 0 ? Math.max(...options.map((o) => counts.get(o.id) ?? 0)) : -1;
  const hasImage = !!profile.contentImageUrl;

  return createPortal(
    <div
      className="fixed z-[9999]"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        left: layout?.outerLeft ?? -9999,
        top: layout?.top ?? -9999,
        width: layout?.outerWidth ?? WIDTH,
        visibility: layout ? 'visible' : 'hidden',
      }}
    >
      <div
        ref={panelRef}
        className="bg-surface-light border border-border rounded-2xl shadow-2xl shadow-black/60 overflow-hidden"
        style={{ width: WIDTH, marginLeft: layout?.panelMarginLeft ?? 0, animation: layout ? `spotlight-in-${layout.side} .18s ease-out` : undefined }}
      >
        {/* Hero: the poll's picture, or its category colour, under the question. */}
        <div className={`relative overflow-hidden bg-black/40 ${hasImage ? '' : 'h-[112px]'}`}>
          {hasImage ? (
            <img
              src={profile.contentImageUrl!}
              alt=""
              decoding="async"
              onLoad={() => setHeroLoaded(true)}
              className="block w-full h-auto max-h-[200px] object-cover"
            />
          ) : (
            <>
              <div className={`absolute inset-0 ${ROLE_COLORS[profile.role]}`} />
              <div className="absolute inset-0 bg-gradient-to-br from-white/15 to-black/50" />
            </>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-3 flex items-end gap-2.5">
            {/* One picture: with a photo the hero is it, so no thumbnail of the
                same photo; without one, the category glyph stands in. */}
            {!hasImage && <PollThumb role={profile.role} imageUrl={null} className="w-11 h-11 ring-2 ring-white/25" />}
            <div className="min-w-0 flex-1">
              <div className="mb-1"><RoleBadge role={profile.role} /></div>
              <h3 className="text-white font-semibold text-[15px] leading-snug line-clamp-3 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                {profile.name}
              </h3>
            </div>
          </div>
        </div>

        {/* The answers, most votes first, each with its share. */}
        <div className="px-3 pt-3 pb-2.5 space-y-2">
          {options.map((o, i) => {
            const n = counts.get(o.id) ?? 0;
            const pct = total > 0 ? Math.round((n / total) * 100) : 0;
            return (
              <div key={o.id} className="flex items-center gap-2.5">
                <OptionMark color={o.color} imageUrl={o.imageUrl} className="w-7 h-7" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="flex-1 min-w-0 truncate text-sm text-white/90">{o.text}</span>
                    {results && (
                      <span className={`shrink-0 tabular-nums text-sm ${n > 0 && n === leader ? 'font-bold text-white' : 'font-semibold text-white/80'}`}>{pct}%</span>
                    )}
                  </div>
                  <span aria-hidden className="mt-1 block h-1 rounded-full bg-white/[0.07] overflow-hidden">
                    {results && (
                      <span
                        className="block h-full rounded-full"
                        style={{ width: `${pct}%`, background: o.color, transformOrigin: 'left', animation: 'bar-fill 0.5s ease-out both', animationDelay: `${i * 50}ms` }}
                      />
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Reach: the poll window's own figures; nothing until results arrive. */}
        {results && (
          <div className="px-3 pb-3">
            <PollSummary profile={profile} />
          </div>
        )}

        {profile.addedBy && (
          <div className="px-3 py-2.5 border-t border-border text-[13px] text-text-secondary">
            {t.reportedBy} <span className="text-white/85">@{profile.addedBy}</span>
            {' · '}{formatRelativeTime(profile.createdAt, locale, t.justNow)}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
