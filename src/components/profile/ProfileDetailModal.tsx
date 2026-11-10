import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { Profile } from '../../types/profile';
import { PollThumb } from '../poll/PollThumb';
import { PollOptions } from '../poll/PollOptions';
import { PollCountries } from '../poll/PollCountries';
import { GlobeIcon } from '../poll/PollIcons';
import { DELETE_MAX_VOTES } from '../../utils/polls';
import { useProfile } from '../../hooks/useProfile';
import { ShareButton } from './ShareButton';
import { ReportProfileButton } from './ReportProfileButton';
import { DeleteProfileButton } from './DeleteProfileButton';
import { ContentImageLightbox } from './ContentImageLightbox';
import { useMe } from '../../hooks/useMe';
import { RoleBadge } from '../common/RoleBadge';
import { HoverTip } from '../common/HoverTip';
import { CollapseDetailsButton } from '../common/CollapseDetailsButton';
import { SourceLink } from './SourceLink';
import { formatRelativeTime } from '../../utils/formatRelativeTime';
import { useI18n } from '../../i18n/I18nContext';
import { useProfileText } from '../../hooks/useProfileText';
import { useSheetDrag } from '../../hooks/useSheetDrag';
import { useDetailsCollapsed } from '../../hooks/useDetailsCollapsed';
import { useMapPanel } from '../../context/useMapPanel';
import { CommentIcon, BumpNumber } from '../comments/CommentCount';
import { WASH } from '../common/wash';
import { CommentsSheet } from '../comments/CommentsSheet';

interface ProfileDetailModalProps {
  profile: Profile;
  onClose: () => void;
}

export function ProfileDetailModal({ profile: seed, onClose }: ProfileDetailModalProps) {
  // The route hands in the poll it has; reading the query here too keeps the
  // results and the caller's vote live after a vote patches the cache.
  const { data } = useProfile(seed.id);
  const profile = data ?? seed;
  const location = useLocation();
  const { t, locale } = useI18n();
  const { data: me } = useMe();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  // Opened from a list card's comment count -> the sheet is up right away.
  const [commentsOpen, setCommentsOpen] = useState(!!(location.state as { comments?: boolean } | null)?.comments);
  // Absent from the response = the API does not serve comments yet: no row.
  const commentsEnabled = profile.commentCount !== undefined;
  const commentCount = profile.commentCount ?? 0;
  const isRegistered = !!me?.user && me.user.tier !== 'anonymous';
  const { registerSheet } = useMapPanel();
  // The chevron folds this sheet's own description, image and country breakdown
  // away, exactly like the desktop modal's - and nothing else. The map panel at
  // the top of the screen has its own grab bar; the two are independent, so any
  // combination is reachable, including map open above a fully expanded detail.
  // (They used to be one switch, which meant the map could not be opened without
  // losing the text and vice versa.)
  const [detailsCollapsed, toggleDetails] = useDetailsCollapsed();
  // Which opinio is on screen. The panel tints whatever is registered here, so
  // opening the map over a detail shows THAT opinio's votes, moving to another
  // opinio re-tints it, and unregistering hands the panel back to global.
  useEffect(() => {
    registerSheet(profile.id);
    return () => registerSheet(null);
  }, [profile.id, registerSheet]);
  const { name, description, hasTranslation, showingOriginal, toggle } = useProfileText(profile);
  const { sheetRef, dragHandlers } = useSheetDrag(onClose);
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
    /* Not a modal: no scrim, and the wrapper takes no pointer events, so the feed
       behind stays scrollable and tappable with a detail open. Collapsing the
       sheet is what makes that worth having - it uncovers the feed, and an
       uncoverable-but-dead feed is just a smaller sheet. Tapping another opinio
       back there swaps this sheet for that one, and the map above re-tints with
       it; there is nothing to dismiss first.
     
       Nothing is lost by dropping the scrim: closing is the X or a drag down on
       the handle, both of which a scrim never provided. What it did provide -
       tap-outside-to-close - is the same gesture as "scroll the feed", which is
       why it had to go.
     
       The wrapper still starts BELOW the map panel (--mobile-map-panel-bottom,
       published by MobileMapPanel) so it can never sit over the map or its grab
       bar, however tall the sheet grows. */
    <div
      className="fixed left-0 right-0 bottom-0 z-50 flex flex-col justify-end pointer-events-none"
      style={{ top: 'var(--mobile-map-panel-bottom, 0px)' }}
    >
      <div ref={sheetRef} className="pointer-events-auto relative bg-surface border-t border-border rounded-t-2xl shadow-2xl shadow-black/50 max-h-[85vh] overflow-y-auto pb-11" style={{ animation: 'modal-enter 0.28s ease-out' }}>
        {/* Handle and header share the panel wash (as ModalShell does). */}
        <div className="user-header-wash rounded-t-2xl" style={WASH}>
        <div className="flex justify-center pt-3 pb-1" {...dragHandlers}>
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>
        <div className="px-4 pt-2.5 pb-2 border-b border-border" {...dragHandlers}>
          <div className="flex items-start gap-2.5 min-w-0">
            {(() => {
              const state = location.state as { fromUserId?: string; fromUserName?: string } | null;
              if (!state?.fromUserId) return null;
              return (
                <HoverTip label={state.fromUserName ? `← @${state.fromUserName}` : 'Back'} className="inline-flex shrink-0 self-center">
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
            })()}
            <PollThumb role={profile.role} imageUrl={profile.imageUrl} className="w-10 h-10" />
            <div className="min-w-0 flex-1">
              <h1 className="block font-semibold text-white leading-snug break-words mb-1">{name}</h1>
              <div className="flex items-center gap-1.5">
                <RoleBadge role={profile.role} />
                <div className="flex items-center gap-0.5 shrink-0 ml-auto -mr-1">
                  <CollapseDetailsButton collapsed={detailsCollapsed} onToggle={toggleDetails} />
                  <ShareButton profileId={profile.id} profileName={profile.name} />
                  <ReportProfileButton profileId={profile.id} />
                  {me?.user.id && (me.user.tier === 'admin' || (profile.addedById === me.user.id && profile.voteCount <= DELETE_MAX_VOTES)) && (
                    <DeleteProfileButton
                      profileId={profile.id}
                      voteCount={profile.voteCount}
                      onDeleted={onClose}
                    />
                  )}
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
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>

        <div className="px-4 pt-4 pb-5 space-y-4">
          {/* Context first - description, picture, link - since it can decide
              the vote; folded by the chevron. Then the answers, which are the
              vote buttons and always stay. .details-fold (index.css) animates
              the fold to the content's own height (0fr), plus the overflow-hidden
              + min-h-0 the clipped child needs and the fade/lift on
              .details-fold-inner. Shared with the desktop modal. */}
          {(description || profile.contentImageUrl || profile.hasLink) && (
          <div className="details-fold" data-collapsed={detailsCollapsed}>
          <div>
          <div className="details-fold-inner space-y-3 pb-4 border-b border-border">
          {(description || profile.contentImageUrl) && (
            <div className="flow-root">
              {profile.contentImageUrl && (
                // A thumbnail beside the text; full size is one tap away.
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  aria-label={profile.name}
                  className={`relative block overflow-hidden rounded-xl bg-black/30 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-accent/60 ${
                    description ? 'float-right ml-3 mb-1 w-28 h-20' : 'w-full h-44'
                  }`}
                >
                  <img
                    src={profile.contentImageUrl}
                    alt={profile.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
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
          {profile.hasLink && (
            <div>
              <SourceLink profileId={profile.id} host={profile.linkHost} />
            </div>
          )}
          </div>
          </div>
          </div>
          )}

          <PollOptions
            profile={profile}
            showingOriginal={showingOriginal}
            pictureClass="w-11 h-11"
          />

          <div className="details-fold" data-collapsed={detailsCollapsed}>
          <div>
          <div className="details-fold-inner space-y-4">
          {profile.addedBy && (
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
          )}

          {/* Comments entry: its own ruled section under the description, the
              same rule the breakdown opens with. On real data this sheet is at
              its 85vh cap, so the thread lives in its own sheet and this row is
              how you get there. Hidden at zero for visitors who cannot write; a
              quiet "write" line at zero for those who can, so a thread can be
              started. */}
          {commentsEnabled && (commentCount > 0 || isRegistered) && (
            <div className="pt-1 border-t border-border">
              <button
                type="button"
                onClick={() => setCommentsOpen(true)}
                className="mt-2 w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 -mx-2.5 text-base text-white/70 hover:text-white hover:bg-white/5 active:bg-white/10 transition-colors"
                style={{ width: 'calc(100% + 1.25rem)' }}
              >
                {/* Same 20px glyph + 16px figure as the list cards. */}
                <CommentIcon className="w-5 h-5" />
                <span className="flex-1 text-left font-medium tabular-nums leading-none">
                  {commentCount > 0 ? t.comments : t.commentsWrite}
                  {commentCount > 0 && <span className="font-normal text-white/50"> (<BumpNumber value={commentCount} />)</span>}
                </span>
                <svg className="w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}

          <div className="pt-3 border-t border-border">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
              <GlobeIcon className="w-3.5 h-3.5" />{t.commentsTabCountries}
            </p>
            {/* No scroller of its own: the sheet scrolls, and a list scrolling
                inside it trapped the finger. Eight rows, then "+N". */}
            <PollCountries profile={profile} limit={8} />
          </div>
          </div>
          </div>
          </div>
        </div>
      </div>
      {lightboxOpen && profile.contentImageUrl && (
        <ContentImageLightbox
          imageUrl={profile.contentImageUrl}
          alt={profile.name}
          onClose={() => setLightboxOpen(false)}
        />
      )}
      {commentsOpen && (
        // The wrapper above is pointer-events-none so the feed stays live;
        // pointer-events inherits, so this contents box hands them back to the
        // sheet the way the lightbox does for itself.
        <div className="contents pointer-events-auto">
          <CommentsSheet profileId={profile.id} profileName={profile.name} count={commentCount} onClose={() => setCommentsOpen(false)} />
        </div>
      )}
    </div>
  );
}
