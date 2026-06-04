import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { Profile } from '../../types/profile';
import type { PersonBreakdownResponse } from '../../types/api';
import { Avatar } from './Avatar';
import { ShareButton } from './ShareButton';
import { DeleteProfileButton } from './DeleteProfileButton';
import { ContentImageLightbox } from './ContentImageLightbox';
import { useMe } from '../../hooks/useMe';
import { RoleBadge } from '../common/RoleBadge';
import { CountryFlag } from '../common/CountryFlag';
import { getCountryFlag, getCountryName } from '../../utils/countries';
import { formatNumber } from '../../utils/formatNumber';
import { formatRelativeTime } from '../../utils/formatRelativeTime';
import { useI18n } from '../../i18n/I18nContext';
import { useProfileText } from '../../hooks/useProfileText';

interface ProfileDetailModalProps {
  profile: Profile;
  breakdown: PersonBreakdownResponse | undefined;
  isLoading: boolean;
  onClose: () => void;
}

export function ProfileDetailModal({ profile, breakdown, isLoading, onClose }: ProfileDetailModalProps) {
  const location = useLocation();
  const { t, locale } = useI18n();
  const { data: me } = useMe();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const { name, description, hasTranslation, showingOriginal, toggle } = useProfileText(profile);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Lightbox handles its own ESC (and stops propagation); only close the
      // sheet when the lightbox isn't covering it.
      if (e.key === 'Escape' && !lightboxOpen) onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, lightboxOpen]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-surface border-t border-border rounded-t-2xl shadow-2xl max-h-[85vh] overflow-y-auto pb-11">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>
        <div className="px-6 py-3 border-b border-border">
          <div className="flex items-center gap-3 min-w-0">
            {(() => {
              const state = location.state as { fromUserId?: string; fromUserName?: string } | null;
              if (!state?.fromUserId) return null;
              return (
                <Link
                  to={`/u/${state.fromUserId}${location.search}`}
                  title={state.fromUserName ? `← @${state.fromUserName}` : 'Back'}
                  aria-label={state.fromUserName ? `Back to @${state.fromUserName}` : 'Back'}
                  className="text-white/40 hover:text-white/80 transition-colors p-1 -ml-1 shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </Link>
              );
            })()}
            <Avatar name={profile.name} imageUrl={profile.imageUrl} className="w-12 h-12 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                <CountryFlag code={profile.countryCode} />
                <span className="font-semibold text-white truncate">{name}</span>
              </div>
              <RoleBadge role={profile.role} />
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 mt-2">
            <div
              className="flex items-center gap-2 text-sm tabular-nums leading-none"
              title={`${formatNumber(profile.likes)} likes · ${formatNumber(profile.dislikes)} dislikes`}
            >
              <span className="inline-flex items-baseline gap-1 text-positive font-semibold">
                <span className="text-[11px]">▲</span>
                {formatNumber(profile.likes)}
              </span>
              <span className="inline-flex items-baseline gap-1 text-negative font-semibold">
                <span className="text-[11px]">▼</span>
                {formatNumber(profile.dislikes)}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {me?.user.id && profile.addedById === me.user.id && (
                <DeleteProfileButton
                  profileId={profile.id}
                  voteCount={profile.likes + profile.dislikes}
                  onDeleted={onClose}
                />
              )}
              <ShareButton profileId={profile.id} profileName={profile.name} />
              <button
                onClick={onClose}
                title={t.close}
                aria-label={t.close}
                className="text-white/40 hover:text-white/80 transition-colors p-1"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-white/80 leading-relaxed">{description}</p>
          {hasTranslation && (
            <button
              type="button"
              onClick={toggle}
              className="text-xs text-text-secondary/70 hover:text-accent transition-colors"
            >
              {showingOriginal ? t.seeTranslation : t.seeOriginal}
            </button>
          )}
          {profile.contentImageUrl && (
            // Text first, image second — the opinion is the primary content.
            // 220 px cap keeps the image as supporting context, not the focus;
            // full size is one tap away via the lightbox.
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="block w-full rounded-lg overflow-hidden bg-black/30 border border-border focus:outline-none focus:ring-2 focus:ring-accent/60"
            >
              <img
                src={profile.contentImageUrl}
                alt={profile.name}
                loading="lazy"
                decoding="async"
                className="w-full h-auto max-h-[220px] object-contain"
              />
            </button>
          )}
          {profile.addedBy && (
            <p className="text-xs text-white/30">
              {t.reportedBy}{' '}
              {profile.addedById ? (
                <Link
                  to={`/u/${profile.addedById}${location.search}`}
                  state={{ fromProfileId: profile.id, fromProfileName: profile.name }}
                  className="text-white/55 hover:text-white/85 hover:underline underline-offset-2 decoration-white/30 transition-colors"
                >
                  @{profile.addedBy}
                </Link>
              ) : (
                <span>@{profile.addedBy}</span>
              )}
              {' · '}{formatRelativeTime(profile.createdAt, locale, t.justNow)}
            </p>
          )}

          {isLoading && (
            <p className="text-xs text-white/30 pt-1">Loading...</p>
          )}
          {breakdown && (breakdown.topLiking.length > 0 || breakdown.topDisliking.length > 0) && (
            <div className="grid grid-cols-2 gap-4 pt-1 border-t border-border">
              <div className="pt-3">
                <p className="text-[10px] font-bold text-positive uppercase tracking-wider mb-2">▲ {t.breakdownLiking}</p>
                <div className="max-h-[140px] overflow-y-auto pr-1 subtle-scrollbar">
                  {breakdown.topLiking.map(({ countryCode, count }) => (
                    <div key={countryCode} className="flex items-center gap-1.5 mb-1">
                      <span className="text-sm">{getCountryFlag(countryCode)}</span>
                      <span className="text-xs text-white/50 flex-1 truncate">{getCountryName(countryCode)}</span>
                      <span className="text-xs text-positive font-medium tabular-nums">{formatNumber(count)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-3">
                <p className="text-[10px] font-bold text-negative uppercase tracking-wider mb-2">▼ {t.breakdownDisliking}</p>
                <div className="max-h-[140px] overflow-y-auto pr-1 subtle-scrollbar">
                  {breakdown.topDisliking.map(({ countryCode, count }) => (
                    <div key={countryCode} className="flex items-center gap-1.5 mb-1">
                      <span className="text-sm">{getCountryFlag(countryCode)}</span>
                      <span className="text-xs text-white/50 flex-1 truncate">{getCountryName(countryCode)}</span>
                      <span className="text-xs text-negative font-medium tabular-nums">{formatNumber(count)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {lightboxOpen && profile.contentImageUrl && (
        <ContentImageLightbox
          imageUrl={profile.contentImageUrl}
          alt={profile.name}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}
