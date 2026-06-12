import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { useLayoutEffect, useEffect, useRef, useState } from 'react';
import type { Profile } from '../../types/profile';
import type { PersonBreakdownResponse, CountryBreakdown } from '../../types/api';
import { FlagImg } from '../common/CountryFlag';
import { RoleBadge } from '../common/RoleBadge';
import { ROLE_COLORS } from '../../utils/roles';
import { Avatar } from './Avatar';
import { formatNumber } from '../../utils/formatNumber';
import { formatRelativeTime } from '../../utils/formatRelativeTime';
import { useI18n } from '../../i18n/I18nContext';

interface PersonTooltipProps {
  profile: Profile;
  breakdown: PersonBreakdownResponse | undefined;
  isLoading: boolean;
  anchorEl: HTMLElement | null;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const WIDTH = 330;
const GAP = 10; // visible gap between card and panel
const MARGIN = 12; // viewport clamp margin

// Country chips stay on a single row. We try up to 5 and drop the overflow,
// estimating each chip's width from its (abbreviated) label so the row never
// wraps or spills — wide counts like "12.1K" just mean fewer flags are shown.
const ROW_AVAIL = 300; // usable px inside the 330px panel (px-3 + a little safety)
const CHIP_GAP = 4; // matches gap-1
const chipPxWidth = (label: string) => 36 + label.length * 7;

interface Layout {
  outerLeft: number;
  outerWidth: number;
  panelMarginLeft: number;
  top: number;
  side: 'left' | 'right';
}

// Lightweight count-up so the headline numbers feel live on open. easeOutCubic.
function useCountUp(target: number, duration = 650): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function GeoRow({
  icon,
  label,
  items,
  loading,
  tone,
}: {
  icon: string;
  label: string;
  items: CountryBreakdown[];
  loading: boolean;
  tone: 'positive' | 'negative';
}) {
  // Brand palette: like = positive green (#22c55e), dislike = accent red (#e94560).
  const labelColor = tone === 'positive' ? 'text-positive' : 'text-accent';
  const barColor = tone === 'positive' ? 'bg-positive/25' : 'bg-accent/25';
  const numColor = tone === 'positive' ? 'text-positive' : 'text-accent';
  // Greedily fit up to 5 chips on one line; drop the rest.
  const top: CountryBreakdown[] = [];
  let usedW = 0;
  for (const it of items.slice(0, 5)) {
    const w = chipPxWidth(formatNumber(it.count)) + (top.length ? CHIP_GAP : 0);
    if (top.length && usedW + w > ROW_AVAIL) break;
    usedW += w;
    top.push(it);
  }
  const max = Math.max(1, ...top.map((i) => i.count));

  return (
    <div>
      <div className={`text-[11px] font-bold uppercase tracking-wider mb-1.5 ${labelColor}`}>
        {icon} {label}
      </div>
      <div className="flex gap-1 overflow-hidden">
        {loading
          ? [0, 1, 2, 3].map((i) => (
              <div key={i} className="h-6 w-11 rounded-md bg-white/5 animate-pulse" />
            ))
          : top.length === 0
            ? <span className="text-[11px] text-text-secondary/50">—</span>
            : top.map(({ countryCode, count }) => (
                <div
                  key={countryCode}
                  className="relative flex items-center gap-1 px-1.5 py-1 rounded-md bg-white/5 overflow-hidden"
                >
                  <div
                    className={`absolute inset-y-0 left-0 ${barColor}`}
                    style={{ width: `${(count / max) * 100}%` }}
                  />
                  <FlagImg code={countryCode} className="relative inline-block align-middle shrink-0" />
                  <span className={`relative text-xs font-semibold tabular-nums ${numColor}`}>
                    {formatNumber(count)}
                  </span>
                </div>
              ))}
      </div>
    </div>
  );
}

export function PersonTooltip({ profile, breakdown, isLoading, anchorEl, onMouseEnter, onMouseLeave }: PersonTooltipProps) {
  const { t, locale } = useI18n();
  const location = useLocation();
  const panelRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<Layout | null>(null);
  // Natural-ratio hero has no reserved height until the image loads, so re-run
  // positioning on load to re-clamp the (now taller) panel against the viewport.
  const [heroLoaded, setHeroLoaded] = useState(false);

  // Anchor to the card element (not the cursor): pin to the inner side with room,
  // clamp to the viewport, and bridge the gap so the pointer can reach the panel.
  useLayoutEffect(() => {
    if (!anchorEl) return;
    const compute = () => {
      const a = anchorEl.getBoundingClientRect();
      const h = panelRef.current?.offsetHeight ?? 360;
      const spaceRight = window.innerWidth - a.right;
      const side: 'left' | 'right' =
        spaceRight >= WIDTH + GAP + MARGIN || spaceRight >= a.left ? 'right' : 'left';

      let panelLeft = side === 'right' ? a.right + GAP : a.left - WIDTH - GAP;
      panelLeft = Math.max(MARGIN, Math.min(panelLeft, window.innerWidth - WIDTH - MARGIN));

      let outerLeft: number;
      let outerWidth: number;
      let panelMarginLeft: number;
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
  }, [anchorEl, profile.contentImageUrl, breakdown, heroLoaded]);

  const total = profile.likes + profile.dislikes;
  const agreePct = total ? Math.round((profile.likes / total) * 100) : 50;
  const net = profile.likes - profile.dislikes;
  const pctUp = useCountUp(agreePct);
  const netUp = useCountUp(net);

  // Sentiment bar grows from a 50/50 split to the real ratio on open.
  const [filled, setFilled] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setFilled(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const hasImage = !!profile.contentImageUrl;
  const netSign = net > 0 ? '+' : '';
  const netTone = net > 0 ? 'text-positive bg-positive/15' : net < 0 ? 'text-accent bg-accent/15' : 'text-text-secondary bg-white/10';

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
        className="bg-surface-light border border-border rounded-2xl shadow-2xl overflow-hidden"
        style={{
          width: WIDTH,
          marginLeft: layout?.panelMarginLeft ?? 0,
          animation: layout ? `spotlight-in-${layout.side} .18s ease-out` : undefined,
        }}
      >
        {/* Hero — content images render at their natural ratio (no forced crop);
            only very tall images are capped. Gradient fallback uses a fixed band. */}
        <div className={`relative overflow-hidden bg-black/40 ${hasImage ? '' : 'h-[124px]'}`}>
          {hasImage ? (
            <img
              src={profile.contentImageUrl!}
              alt={profile.name}
              loading="lazy"
              decoding="async"
              onLoad={() => setHeroLoaded(true)}
              className="block w-full h-auto max-h-[300px] object-cover"
            />
          ) : (
            <>
              <div className={`absolute inset-0 ${ROLE_COLORS[profile.role]}`} />
              <div className="absolute inset-0 bg-gradient-to-br from-white/15 to-black/50" />
            </>
          )}
          {/* Scrim for legible text over any image */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
          {/* Identity — avatar always shown (over the image or the gradient) */}
          <div className="absolute inset-x-0 bottom-0 p-3 flex items-end gap-2.5">
            <Avatar
              name={profile.name}
              imageUrl={profile.imageUrl}
              className="w-11 h-11 ring-2 ring-white/25"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-1">
                <FlagImg code={profile.countryCode} className="inline-block align-middle shrink-0" />
                <RoleBadge role={profile.role} />
              </div>
              <h3 className="text-white font-semibold text-[15px] leading-snug line-clamp-2 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                {profile.name}
              </h3>
            </div>
          </div>
        </div>

        {/* Sentiment — a 0-vote profile has no real ratio, so showing "50%
            liked" would be fabricated. Render a neutral placeholder instead. */}
        <div className="px-3 py-2.5">
          {total === 0 ? (
            <div className="text-sm text-text-secondary">{t.noVotesYet}</div>
          ) : (
            <>
              <div className="flex items-end justify-between mb-2.5">
                <div className="flex items-baseline gap-1">
                  <span className="text-positive text-xl font-bold tabular-nums leading-none">{pctUp}%</span>
                  <span className="text-sm text-text-secondary">{t.liked}</span>
                </div>
                <span className={`text-sm font-bold tabular-nums px-2 py-0.5 rounded-full ${netTone}`}>
                  {netSign}{formatNumber(netUp)}
                </span>
              </div>
              <div className="relative h-2 rounded-full overflow-hidden bg-accent/35">
                <div
                  className="absolute inset-y-0 left-0 bg-positive rounded-full transition-[width] duration-700 ease-out"
                  style={{ width: `${filled ? agreePct : 50}%` }}
                />
              </div>
            </>
          )}
        </div>

        {/* Geography */}
        <div className="px-3 py-2.5 space-y-2.5 border-t border-border">
          <GeoRow icon="▲" label={t.popularIn} items={breakdown?.topLiking ?? []} loading={isLoading} tone="positive" />
          <GeoRow icon="▼" label={t.dislikedIn} items={breakdown?.topDisliking ?? []} loading={isLoading} tone="negative" />
        </div>

        {/* Meta */}
        {profile.addedBy && (
          <div className="px-3 py-2.5 border-t border-border text-xs text-text-secondary">
            {t.reportedBy}{' '}
            {profile.addedById ? (
              <Link
                to={`/u/${profile.addedById}${location.search}`}
                onClick={(e) => e.stopPropagation()}
                className="text-white/85 hover:text-white underline decoration-white/25 hover:decoration-white/70 underline-offset-2"
              >
                @{profile.addedBy}
              </Link>
            ) : (
              <span>@{profile.addedBy}</span>
            )}
            {' · '}
            {formatRelativeTime(profile.createdAt, locale, t.justNow)}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
