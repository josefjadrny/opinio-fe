import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import type { Profile } from '../../types/profile';
import type { PersonBreakdownResponse } from '../../types/api';
import { getCountryFlag, getCountryName } from '../../utils/countries';
import { RoleBadge } from '../common/RoleBadge';
import { Avatar } from './Avatar';
import { formatNumber } from '../../utils/formatNumber';
import { formatRelativeTime } from '../../utils/formatRelativeTime';
import { useI18n } from '../../i18n/I18nContext';

interface PersonTooltipProps {
  profile: Profile;
  breakdown: PersonBreakdownResponse | undefined;
  isLoading: boolean;
  position: { x: number; y: number };
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const WIDTH = 280;
// Approximate content-area height. Used to flip the tooltip above the cursor
// when it would overflow the viewport bottom. Slightly larger when a content
// image is present, since the preview thumb adds ~150 px to the panel.
const HEIGHT = 420;
const HEIGHT_WITH_IMAGE = 560;
const PADDING = 14;

export function PersonTooltip({ profile, breakdown, isLoading, position, onMouseEnter, onMouseLeave }: PersonTooltipProps) {
  const { t, locale } = useI18n();
  const location = useLocation();
  const height = profile.contentImageUrl ? HEIGHT_WITH_IMAGE : HEIGHT;
  let left = position.x + PADDING;
  let top = position.y + PADDING;
  if (left + WIDTH > window.innerWidth) left = position.x - WIDTH - PADDING;
  if (top + height > window.innerHeight) top = position.y - height - PADDING;
  if (top < 60) top = 60;
  if (left < PADDING) left = PADDING;

  return createPortal(
    <div
      className="fixed z-[9999] bg-surface-light border border-border rounded-xl shadow-2xl overflow-hidden"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ left, top, width: WIDTH }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 p-2.5 border-b border-border">
        <Avatar name={profile.name} imageUrl={profile.imageUrl} className="w-10 h-10 shrink-0" />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap leading-tight">
            <span className="text-sm">{getCountryFlag(profile.countryCode)}</span>
            <span className="font-semibold text-white text-sm truncate">{profile.name}</span>
          </div>
          <div className="mt-1">
            <RoleBadge role={profile.role} />
          </div>
        </div>
      </div>

      {/* Content image preview (desktop hover only — this tooltip is gated out on mobile) */}
      {profile.contentImageUrl && (
        <div className="bg-black/30">
          <img
            src={profile.contentImageUrl}
            alt={profile.name}
            loading="lazy"
            decoding="async"
            className="w-full h-auto max-h-[140px] object-cover block"
          />
        </div>
      )}

      {/* Description */}
      <div className="px-3 py-2 border-b border-border">
        <p className="text-xs text-text-secondary line-clamp-3">{profile.description}</p>
        {profile.addedBy && (
          <p className="text-[10px] text-text-secondary/50 mt-1">
            {t.reportedBy}{' '}
            {profile.addedById ? (
              <Link
                to={`/u/${profile.addedById}${location.search}`}
                onClick={(e) => e.stopPropagation()}
                className="text-white/70 hover:text-white hover:underline underline-offset-2 decoration-white/30 transition-colors"
              >
                @{profile.addedBy}
              </Link>
            ) : (
              <span>@{profile.addedBy}</span>
            )}
            {' · '}{formatRelativeTime(profile.createdAt, locale, t.justNow)}
          </p>
        )}
      </div>

      {/* Vote totals */}
      <div className="flex gap-3 px-3 py-2 border-b border-border">
        <div className="flex items-center gap-1.5">
          <span className="text-positive text-sm">▲</span>
          <span className="text-sm font-bold text-positive">{formatNumber(profile.likes)}</span>
          <span className="text-xs text-text-secondary">{t.agree}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-negative text-sm">▼</span>
          <span className="text-sm font-bold text-negative">{formatNumber(profile.dislikes)}</span>
          <span className="text-xs text-text-secondary">{t.disagree}</span>
        </div>
      </div>

      {/* Country breakdown */}
      {isLoading && (
        <div className="px-3 py-3 text-xs text-text-secondary">Loading...</div>
      )}

      {breakdown && (
        <div className="px-3 py-2 grid grid-cols-2 gap-x-3 gap-y-0.5">
          {/* Top liking */}
          <div>
            <p className="text-[10px] font-bold text-positive uppercase tracking-wider mb-1">
              ▲ {t.breakdownLiking}
            </p>
            {breakdown.topLiking.slice(0, 5).map(({ countryCode, count }) => (
              <div key={countryCode} className="flex items-center gap-1 mb-0.5">
                <span className="text-xs">{getCountryFlag(countryCode)}</span>
                <span className="text-[11px] text-text-secondary truncate flex-1">
                  {getCountryName(countryCode)}
                </span>
                <span className="text-[11px] text-positive font-medium tabular-nums">
                  {formatNumber(count)}
                </span>
              </div>
            ))}
          </div>

          {/* Top disliking */}
          <div>
            <p className="text-[10px] font-bold text-negative uppercase tracking-wider mb-1">
              ▼ {t.breakdownDisliking}
            </p>
            {breakdown.topDisliking.slice(0, 5).map(({ countryCode, count }) => (
              <div key={countryCode} className="flex items-center gap-1 mb-0.5">
                <span className="text-xs">{getCountryFlag(countryCode)}</span>
                <span className="text-[11px] text-text-secondary truncate flex-1">
                  {getCountryName(countryCode)}
                </span>
                <span className="text-[11px] text-negative font-medium tabular-nums">
                  {formatNumber(count)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}
