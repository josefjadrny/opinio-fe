import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useProfile } from '../../hooks/useProfile';
import { ContentImageLightbox } from './ContentImageLightbox';
import { useMe } from '../../hooks/useMe';
import { useI18n } from '../../i18n/I18nContext';
import { useProfileText } from '../../hooks/useProfileText';
import { PollThumb } from '../poll/PollThumb';
import { PollOptions } from '../poll/PollOptions';
import { PollCountries } from '../poll/PollCountries';
import { GlobeIcon } from '../poll/PollIcons';
import { PollSummary } from '../poll/PollSummary';
import { DELETE_MAX_VOTES } from '../../utils/polls';
import { ShareButton } from './ShareButton';
import { ReportProfileButton } from './ReportProfileButton';
import { DeleteProfileButton } from './DeleteProfileButton';
import { RoleBadge } from '../common/RoleBadge';
import { HoverTip } from '../common/HoverTip';
import { CollapseDetailsButton } from '../common/CollapseDetailsButton';
import { SourceLink } from './SourceLink';
import { LinkedNews } from '../news/LinkedNews';
import { formatRelativeTime } from '../../utils/formatRelativeTime';
import { useDetailsCollapsed } from '../../hooks/useDetailsCollapsed';
import { CommentIcon, BumpNumber } from '../comments/CommentCount';
import { commentCountLabel } from '../comments/commentCountLabel';
import { WASH } from '../common/wash';
import { CommentList, CommentComposer, CommentThreadProvider } from '../comments/CommentThread';

interface DesktopProfileModalProps {
  profileId: string;
}

export function DesktopProfileModal({ profileId }: DesktopProfileModalProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, locale } = useI18n();
  const { data: profile, isLoading } = useProfile(profileId);
  const { data: me } = useMe();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  // Right column: country breakdown or the comment thread. Same box either
  // way - its height comes from the description column, so neither view can
  // grow the modal.
  // Opened from a list card's comment count -> start on the thread.
  const [rightTab, setRightTab] = useState<'countries' | 'comments'>(
    (location.state as { comments?: boolean } | null)?.comments ? 'comments' : 'countries',
  );
  // Absent from the response = the API does not serve comments yet; the tab
  // row is not rendered at all and the column is the plain breakdown.
  const commentsEnabled = profile?.commentCount !== undefined;
  const commentCount = profile?.commentCount ?? 0;
  // Collapsing drops the description + country breakdown, shrinking this
  // bottom-anchored card so the map behind it is actually usable - at a Full HD
  // viewport the expanded modal leaves only ~40% of the map visible, and the
  // covered part is where most of the voting countries are. Header, sentiment bar
  // and the vote buttons stay, so you can still read and vote while on the map.
  // Persisted: someone who came for the map wants it to stay that way.
  // Shared with the mobile sheet's chevron - same choice, one key.
  const [detailsCollapsed, toggleDetails] = useDetailsCollapsed();
  const { name, description, hasTranslation, showingOriginal, toggle } = useProfileText(profile);

  const close = () => navigate('/' + location.search);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Lightbox owns ESC while open; only close the modal otherwise.
      if (e.key === 'Escape' && !lightboxOpen) close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [navigate, location.search, lightboxOpen]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end items-center pointer-events-none"
    >
      <div className="absolute bottom-0 left-0 right-0 h-[55vh] bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      <div className="bg-surface-light border border-border rounded-2xl shadow-2xl w-full max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl mx-4 flex flex-col max-h-[calc(100dvh-10rem)] mb-16 overflow-hidden pointer-events-auto shadow-black/50" style={{ animation: 'modal-enter 0.25s ease-out' }}>
        {isLoading && (
          <div className="flex items-center justify-center py-12 text-sm text-white/50">Loading…</div>
        )}

        {profile && (
          <>
            {/* Header, on the panel wash */}
            <div className="user-header-wash flex items-center gap-3 px-6 py-4 border-b border-border shrink-0" style={WASH}>
              {(() => {
                const state = location.state as {
                  fromUserId?: string; fromUserName?: string;
                  fromCountryCode?: string; fromCountryName?: string;
                } | null;
                if (state?.fromUserId) {
                  return (
                    <HoverTip label={state.fromUserName ? `← @${state.fromUserName}` : 'Back'}>
                      <Link
                        to={`/u/${state.fromUserId}${location.search}`}
                        aria-label={state.fromUserName ? `Back to @${state.fromUserName}` : 'Back'}
                        className="text-white/40 hover:text-white/80 transition-colors p-1 -ml-1 shrink-0"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                      </Link>
                    </HoverTip>
                  );
                }
                if (state?.fromCountryCode) {
                  return (
                    <HoverTip label={state.fromCountryName ? `← ${state.fromCountryName}` : 'Back'}>
                      <Link
                        to={`/c/${state.fromCountryCode}${location.search}`}
                        aria-label={state.fromCountryName ? `Back to ${state.fromCountryName}` : 'Back'}
                        className="text-white/40 hover:text-white/80 transition-colors p-1 -ml-1 shrink-0"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                      </Link>
                    </HoverTip>
                  );
                }
                return null;
              })()}
              <PollThumb role={profile.role} imageUrl={profile.imageUrl} className="w-12 h-12" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  {/* Stays h1 at every width. Above 1366 MapProfileTitle adds a
                      second h1 over the map carrying the same opinio - deliberate:
                      multiple h1s are valid HTML5 and Google does not rank on their
                      count, and below 1366 there is no map, so keeping this one
                      unconditional is what guarantees the page always has an h1.

                      20px from lg up, 16 below: a question runs to 80
                      characters, so it wraps either way and the role badge
                      follows it on the line (flex-wrap). */}
                  <h1 className="text-base lg:text-xl font-semibold text-white leading-snug break-words min-w-0">{name}</h1>
                  <RoleBadge role={profile.role} />
                </div>
                <p className="text-[13px] text-white/60">
                  {t.reportedBy}{' '}
                  {profile.addedById ? (
                    <Link
                      to={`/u/${profile.addedById}${location.search}`}
                      state={{ fromProfileId: profile.id, fromProfileName: profile.name }}
                      className="text-white/75 hover:text-white hover:underline underline-offset-2 decoration-white/30 transition-colors"
                    >
                      @{profile.addedBy}
                    </Link>
                  ) : (
                    <span>@{profile.addedBy}</span>
                  )}
                  {' · '}{formatRelativeTime(profile.createdAt, locale, t.justNow)}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <CollapseDetailsButton collapsed={detailsCollapsed} onToggle={toggleDetails} />
                <ShareButton profileId={profile.id} profileName={profile.name} />
                <ReportProfileButton profileId={profile.id} />
                {me?.user.id && (me.user.tier === 'admin' || (profile.addedById === me.user.id && profile.voteCount <= DELETE_MAX_VOTES)) && (
                  <DeleteProfileButton
                    profileId={profile.id}
                    voteCount={profile.voteCount}
                    onDeleted={close}
                  />
                )}
                <HoverTip label={t.close}>
                  <button
                    onClick={close}
                    aria-label={t.close}
                    className="text-white/40 hover:text-white/80 transition-colors p-1"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </HoverTip>
              </div>
            </div>

            {/* Body - two columns, each its own scroller. The body itself never
                scrolls: an outer scroller around an inner list put two scrollbars
                side by side. Its height is the left column's content (the right
                column is absolute, see below), capped by the card's max-height. */}
            <div className="flex-1 min-h-0 flex divide-x divide-border">
                    {/* Left: the context first (description, picture, news), as
                        it can decide the vote; then the answers, which are the
                        vote buttons and are never folded by the chevron. */}
                    <div className="flex-1 basis-0 min-w-0 overflow-y-auto subtle-scrollbar px-6 py-5">
                      {!detailsCollapsed && (description || profile.contentImageUrl || profile.hasLink || profile.newsId) && (
                      <div className="mb-5 pb-5 border-b border-border space-y-3">
                      {(description || profile.contentImageUrl) && (
                        // flow-root contains the floated picture, so the next
                        // block starts under it whatever the text length.
                        <div className="flow-root">
                          {profile.contentImageUrl && (
                            // A thumbnail beside the text, not a 240px block under
                            // it: the picture is context, and at full height it
                            // pushed the window over the whole map. Click opens
                            // the full 1280px in the lightbox.
                            <button
                              type="button"
                              onClick={() => setLightboxOpen(true)}
                              aria-label={profile.name}
                              className={`group relative block overflow-hidden rounded-xl bg-black/30 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-accent/60 ${
                                description ? 'float-right ml-4 mb-1 w-36 h-28' : 'w-full h-48'
                              }`}
                            >
                              <img
                                src={profile.contentImageUrl}
                                alt={profile.name}
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                              <span aria-hidden className="absolute right-1.5 bottom-1.5 rounded-md bg-black/55 p-1 text-white/90 opacity-0 group-hover:opacity-100 transition-opacity">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
                                </svg>
                              </span>
                            </button>
                          )}
                          {description && <p className="text-[15px] text-white/80 leading-relaxed">{description}</p>}
                        </div>
                      )}
                      {hasTranslation && (
                        <button
                          type="button"
                          onClick={toggle}
                          className="text-[13px] text-text-secondary hover:text-accent transition-colors"
                        >
                          {showingOriginal ? t.seeTranslation : t.seeOriginal}
                        </button>
                      )}
                      <LinkedNews profile={profile} />
                      {profile.hasLink && (
                        <div>
                          <SourceLink profileId={profile.id} host={profile.linkHost} />
                        </div>
                      )}
                      </div>
                      )}
                      <PollOptions
                        profile={profile}
                        showingOriginal={showingOriginal}
                        pictureClass="w-12 h-12"
                        summary={detailsCollapsed}
                      />
                    </div>

                    {/* Right: breakdown. The wrapper is `relative` with its content
                        `absolute inset-0`, so the column contributes no intrinsic
                        height — the grid row is sized by the LEFT (opinion text)
                        column. The lists then scroll to fit that height instead of
                        growing the modal just to list 10 countries. A min-height
                        floor keeps it usable when the opinion text is very short. */}
                    {/* The 200px floor is for the breakdown when the text is
                        short. A thread needs more than one visible comment
                        under its composer, so with comments the floor is 360 -
                        on production text (150-250 chars + a 240px image) the
                        column is already ~400px and neither floor applies.
                        The floor follows the feature, NOT the open tab: keyed
                        on the tab it made the whole modal jump on every
                        Countries <-> Comments switch when the text was short. */}
                    {!detailsCollapsed && <div className={`relative flex-1 basis-0 min-w-0 ${commentsEnabled ? 'min-h-[360px]' : 'min-h-[200px]'}`}>
                      <div className="absolute inset-0 px-6 py-5 flex flex-col">
                        <div className="shrink-0 mb-4"><PollSummary profile={profile} /></div>
                        {/* Segmented switch over the column. Countries is the
                            default; the count on the other segment is the only
                            place the detail advertises comments. */}
                        {commentsEnabled && <div className="flex items-center gap-1 mb-3 shrink-0 -mx-1">
                          {(['countries', 'comments'] as const).map((tab) => {
                            const active = rightTab === tab;
                            return (
                              <button
                                key={tab}
                                type="button"
                                onClick={() => setRightTab(tab)}
                                className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-bold uppercase tracking-wider transition-colors ${
                                  active ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                                }`}
                              >
                                {tab === 'comments' ? (
                                  <CommentIcon className="w-3.5 h-3.5" />
                                ) : (
                                  <GlobeIcon className="w-3.5 h-3.5" />
                                )}
                                {tab === 'countries' ? t.commentsTabCountries : t.commentsTabComments}
                                {tab === 'comments' && commentCount > 0 && (
                                  <span className={`tabular-nums normal-case tracking-normal font-normal ${active ? 'text-white/70' : 'text-white/50'}`}>(<BumpNumber value={commentCount} />)</span>
                                )}
                              </button>
                            );
                          })}
                        </div>}
                        {commentsEnabled && rightTab === 'comments' ? (
                          <CommentThreadProvider key={profileId}>
                          <div className="flex-1 min-h-0 flex flex-col">
                            <div className="flex-1 min-h-0 overflow-y-auto pr-1 subtle-scrollbar" aria-label={commentCountLabel(t, locale, commentCount)}>
                              <CommentList profileId={profileId} profileName={profile.name} />
                            </div>
                            <div className="shrink-0 pt-3 mt-1 border-t border-border">
                              <CommentComposer profileId={profileId} />
                            </div>
                          </div>
                          </CommentThreadProvider>
                        ) : (
                          <div className="flex-1 min-h-0 overflow-y-auto pr-1 subtle-scrollbar">
                            <PollCountries profile={profile} />
                          </div>
                        )}
                      </div>
                    </div>}
            </div>

          </>
        )}
      </div>
      {lightboxOpen && profile?.contentImageUrl && (
        <ContentImageLightbox
          imageUrl={profile.contentImageUrl}
          alt={profile.name}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}
