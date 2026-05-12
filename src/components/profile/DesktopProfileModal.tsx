import { useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useProfile } from '../../hooks/useProfile';
import { usePersonBreakdown } from '../../hooks/usePersonBreakdown';
import { useVote } from '../../hooks/useVote';
import { useMe } from '../../hooks/useMe';
import { useCountdown } from '../../hooks/useCountdown';
import { useI18n } from '../../i18n/I18nContext';
import { Avatar } from './Avatar';
import { ShareButton } from './ShareButton';
import { DeleteProfileButton } from './DeleteProfileButton';
import { RoleBadge } from '../common/RoleBadge';
import { CountryFlag } from '../common/CountryFlag';
import { getCountryFlag, getCountryName } from '../../utils/countries';
import { formatNumber } from '../../utils/formatNumber';
import { formatRelativeTime } from '../../utils/formatRelativeTime';

interface DesktopProfileModalProps {
  profileId: string;
}

export function DesktopProfileModal({ profileId }: DesktopProfileModalProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, locale } = useI18n();
  const { data: profile, isLoading } = useProfile(profileId);
  const { data: breakdown } = usePersonBreakdown(profileId);
  const voteMutation = useVote();
  const { data: me } = useMe();

  const hasCountry = me === undefined || !!me.user.countryCode;
  const isRegistered = !!me?.user && me.user.tier !== 'anonymous';
  const noCountryMsg = isRegistered ? t.noCountryWarningRegistered : t.noCountryWarning;
  const canLike = hasCountry && (me?.voteAllowance.like.remaining ?? 0) > 0;
  const canDislike = hasCountry && (me?.voteAllowance.dislike.remaining ?? 0) > 0;
  const likeCountdown = useCountdown(!canLike && hasCountry ? me?.voteAllowance.like.nextAt ?? null : null);
  const dislikeCountdown = useCountdown(!canDislike && hasCountry ? me?.voteAllowance.dislike.nextAt ?? null : null);

  const close = () => navigate('/' + location.search);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [navigate, location.search]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end items-center pointer-events-none">
      <div className="absolute bottom-0 left-0 right-0 h-[55vh] bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      <div className="bg-surface-light border border-border rounded-2xl shadow-2xl w-full max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl mx-4 flex flex-col max-h-[calc(100dvh-10rem)] mb-16 overflow-hidden pointer-events-auto">
        {isLoading && (
          <div className="flex items-center justify-center py-12 text-sm text-white/40">Loading…</div>
        )}

        {profile && (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-border shrink-0">
              {(() => {
                const state = location.state as {
                  fromUserId?: string; fromUserName?: string;
                  fromCountryCode?: string; fromCountryName?: string;
                } | null;
                if (state?.fromUserId) {
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
                }
                if (state?.fromCountryCode) {
                  return (
                    <Link
                      to={`/c/${state.fromCountryCode}${location.search}`}
                      title={state.fromCountryName ? `← ${state.fromCountryName}` : 'Back'}
                      aria-label={state.fromCountryName ? `Back to ${state.fromCountryName}` : 'Back'}
                      className="text-white/40 hover:text-white/80 transition-colors p-1 -ml-1 shrink-0"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                    </Link>
                  );
                }
                return null;
              })()}
              <Avatar name={profile.name} imageUrl={profile.imageUrl} className="w-11 h-11 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                  <span className="font-semibold text-white truncate">{profile.name}</span>
                  <CountryFlag code={profile.countryCode} />
                  <RoleBadge role={profile.role} />
                </div>
                <p className="text-[11px] text-white/30">
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
              </div>
              <div
                className="shrink-0 flex items-center gap-2 text-sm tabular-nums leading-none"
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
                    onDeleted={close}
                  />
                )}
                <ShareButton profileId={profile.id} profileName={profile.name} />
                <button
                  onClick={close}
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

            {/* Body - two columns */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-0 divide-x divide-border">
                {/* Left: description */}
                <div className="px-6 py-4">
                  <p className="text-sm text-white/70 leading-relaxed">{profile.description}</p>
                </div>

                {/* Right: breakdown */}
                <div className="px-6 py-4">
                  {breakdown && (breakdown.topLiking.length > 0 || breakdown.topDisliking.length > 0) ? (
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-[10px] font-bold text-positive uppercase tracking-wider mb-2">▲ Top fans</p>
                        {breakdown.topLiking.map(({ countryCode, count }) => (
                          <div key={countryCode} className="flex items-center gap-1.5 mb-1.5">
                            <span className="text-sm">{getCountryFlag(countryCode)}</span>
                            <span className="text-xs text-white/50 flex-1 truncate">{getCountryName(countryCode)}</span>
                            <span className="text-xs text-positive font-medium tabular-nums">{formatNumber(count)}</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-negative uppercase tracking-wider mb-2">▼ Critics</p>
                        {breakdown.topDisliking.map(({ countryCode, count }) => (
                          <div key={countryCode} className="flex items-center gap-1.5 mb-1.5">
                            <span className="text-sm">{getCountryFlag(countryCode)}</span>
                            <span className="text-xs text-white/50 flex-1 truncate">{getCountryName(countryCode)}</span>
                            <span className="text-xs text-negative font-medium tabular-nums">{formatNumber(count)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-white/20">No votes yet</p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer - full-width vote buttons */}
            <div className="flex shrink-0 border-t border-border rounded-none">
              <button
                onClick={() => voteMutation.mutate({ profileId: profile.id, type: 'like' })}
                disabled={!canLike}
                title={!hasCountry ? noCountryMsg : undefined}
                className={`flex-1 flex items-center justify-center gap-2.5 py-4 text-base font-semibold transition-colors border-r border-border rounded-none ${
                  canLike
                    ? 'cursor-pointer bg-positive/10 hover:bg-positive/20 text-positive'
                    : 'cursor-not-allowed bg-white/[0.02] text-white/25'
                }`}
              >
                <span>▲</span>
                {!canLike && likeCountdown ? (
                  <span className="text-sm font-medium tabular-nums">{t.nextVote} {likeCountdown}</span>
                ) : (
                  <span>{t.agree}</span>
                )}
              </button>
              <button
                onClick={() => voteMutation.mutate({ profileId: profile.id, type: 'dislike' })}
                disabled={!canDislike}
                title={!hasCountry ? noCountryMsg : undefined}
                className={`flex-1 flex items-center justify-center gap-2.5 py-4 text-base font-semibold transition-colors rounded-none ${
                  canDislike
                    ? 'cursor-pointer bg-negative/10 hover:bg-negative/20 text-negative'
                    : 'cursor-not-allowed bg-white/[0.02] text-white/25'
                }`}
              >
                <span>▼</span>
                {!canDislike && dislikeCountdown ? (
                  <span className="text-sm font-medium tabular-nums">{t.nextVote} {dislikeCountdown}</span>
                ) : (
                  <span>{t.disagree}</span>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
