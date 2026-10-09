import { Fragment, useEffect, useState, type CSSProperties } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useUser } from '../../hooks/useUser';
import { useMe } from '../../hooks/useMe';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useSheetDrag } from '../../hooks/useSheetDrag';
import { useUserDetailsCollapsed } from '../../hooks/useDetailsCollapsed';
import { useI18n } from '../../i18n/I18nContext';
import { Avatar } from './Avatar';
import { StatTip } from '../common/StatTip';
import { googleAvatarAtSize } from '../../utils/avatarUrl';
import { CountryFlag } from '../common/CountryFlag';
import { CollapseDetailsButton } from '../common/CollapseDetailsButton';
import { UserActivityList } from './UserActivityList';
import { VoteHeadline } from './VoteHeadline';
import { HoverTip } from '../common/HoverTip';

interface UserDetailModalProps {
  userId: string;
}

const LOCALE_TO_BCP47: Record<string, string> = { en: 'en-US', cs: 'cs-CZ', es: 'es-ES', de: 'de-DE', fr: 'fr-FR' };

function formatJoinDate(iso: string, locale: string) {
  const tag = LOCALE_TO_BCP47[locale] ?? 'en-US';
  return new Date(iso).toLocaleDateString(tag, { month: 'short', day: 'numeric', year: 'numeric' });
}

function ShareUserButton({ userId, displayName }: { userId: string; displayName: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  async function handleShare() {
    const url = `${window.location.origin}/u/${userId}`;
    const title = `@${displayName} - Opinio`;
    if (typeof navigator.share === 'function') {
      try { await navigator.share({ title, url }); return; } catch { return; }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt(t.linkCopied, url);
    }
  }
  return (
    <HoverTip label={copied ? t.linkCopied : t.share}>
      <button
        onClick={handleShare}
        aria-label={t.share}
        className="text-white/60 hover:text-white/90 transition-colors p-1 shrink-0"
      >
        {copied ? (
          <svg className="w-5 h-5 text-positive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        )}
      </button>
    </HoverTip>
  );
}

export function UserDetailModal({ userId }: UserDetailModalProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { t, locale } = useI18n();
  const { data: user, isLoading, error } = useUser(userId);
  const { data: me } = useMe();

  // Display name, photo and country are edited in Settings but rendered here,
  // so your own profile is the natural place to reach for them. Only ever
  // shown to the owner - visitors see the unchanged header.
  const isMe = !!me?.user && me.user.id === userId && me.user.tier !== 'anonymous';

  const close = () => navigate('/' + location.search);
  // Shared between the mobile sheet and the desktop card - same choice, one
  // key - exactly as the opinio and country modals' chevrons are.
  const [detailsCollapsed, toggleDetails] = useUserDetailsCollapsed();
  const { sheetRef, dragHandlers } = useSheetDrag(close);
  const backState = { fromUserId: userId, fromUserName: user?.displayName ?? null };
  const openProfile = (profileId: string) => navigate('/p/' + profileId + location.search, { state: backState });
  // A comment row lands on the thread it came from (same `comments` flag a
  // card's comment count sets), not on the country breakdown.
  const openThread = (profileId: string) => navigate('/p/' + profileId + location.search, { state: { ...backState, comments: true } });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const notFound = !!error;
  const hasAvatar = !!user?.avatarUrl;
  // A picture link that fails to load renders the initials fallback, which
  // reads as "no picture" just like an empty link. Keyed by the URL so the
  // flag resets when the user (or their picture) changes.
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);
  const avatarSrc = googleAvatarAtSize(user?.avatarUrl ?? null, 256);
  const showsPicture = hasAvatar && failedAvatarUrl !== avatarSrc;
  // The picture is shown large only when there is something to fill the
  // column beside it: a real picture or a bio. A bare placeholder with an
  // empty column beside it keeps the opinio and country modals' size.
  const largeAvatar = showsPicture || !!user?.bio;

  // The sentiment ring and header wash read the user's like share: the live
  // 24h counts when there are any, else lifetime, else no split at all.
  const liveTotal = (user?.likesReceived ?? 0) + (user?.dislikesReceived ?? 0);
  const lifeTotal = (user?.totalLikesReceived ?? 0) + (user?.totalDislikesReceived ?? 0);
  const likeShare = liveTotal > 0 ? (user!.likesReceived / liveTotal)
    : lifeTotal > 0 ? (user!.totalLikesReceived / lifeTotal) : null;
  const leansLike = likeShare !== null && likeShare >= 0.5;
  const ringStyle = {
    '--ring-target': `${Math.round((likeShare ?? 0) * 100)}%`,
    '--ring-glow': likeShare === null ? 'transparent' : leansLike ? 'rgba(34,197,94,0.45)' : 'rgba(239,68,68,0.45)',
  } as CSSProperties;
  // What the ring means, on hover (tap on a phone): the window it reads, then
  // the split it draws. Percent via Intl so cs/de/fr/pl get their spacing.
  // Names whose opinios the votes are on (the handle, or "your" on your own
  // page) - without it the line reads as votes this user cast.
  const ringTipText = (isMe
    ? (liveTotal > 0 ? t.avatarRingLiveYou : lifeTotal > 0 ? t.avatarRingLifetimeYou : t.avatarRingNoneYou)
    : (liveTotal > 0 ? t.avatarRingLive : lifeTotal > 0 ? t.avatarRingLifetime : t.avatarRingNone)
  ).replace('{handle}', `@${user?.displayName ?? ''}`);
  // One plain sentence with the like count - no percentages, no sums to do.
  // The count is the like votes in the same window the ring reads, and the
  // noun after it follows the locale's plural rules (1 lajk, 2 lajky, 5 lajků).
  const ringLikes = liveTotal > 0 ? (user?.likesReceived ?? 0) : (user?.totalLikesReceived ?? 0);
  const likesCategory = new Intl.PluralRules(locale).select(ringLikes);
  const ringLikesText = (likesCategory === 'one' ? t.avatarRingLikesOne : likesCategory === 'few' ? t.avatarRingLikesFew : t.avatarRingLikesMany)
    .replace('{n}', new Intl.NumberFormat(locale).format(ringLikes));
  const ringTipLabel = ringTipText.replace('{likes}', ringLikesText);
  const ringTipPanel = (
    <p className="text-sm text-white/80 leading-snug">
      {ringTipText.split('{likes}').map((part, i) => (
        <Fragment key={i}>
          {i > 0 && <strong className="font-semibold text-positive">{ringLikesText}</strong>}
          {part}
        </Fragment>
      ))}
    </p>
  );
  const washStyle = {
    '--wash-a': likeShare === null ? 'rgba(255,255,255,0.04)' : leansLike ? 'rgba(34,197,94,0.13)' : 'rgba(239,68,68,0.13)',
    '--wash-b': likeShare === null ? 'transparent' : leansLike ? 'rgba(239,68,68,0.06)' : 'rgba(34,197,94,0.06)',
  } as CSSProperties;

  const fromProfileState = location.state as { fromProfileId?: string; fromProfileName?: string } | null;
  const BackToProfile = fromProfileState?.fromProfileId ? (
    <HoverTip label={fromProfileState.fromProfileName ? `← ${fromProfileState.fromProfileName}` : 'Back'}>
      <Link
        to={`/p/${fromProfileState.fromProfileId}${location.search}`}
        aria-label={fromProfileState.fromProfileName ? `Back to ${fromProfileState.fromProfileName}` : 'Back'}
        className="text-white/60 hover:text-white/90 transition-colors p-0.5 -ml-1 shrink-0"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </Link>
    </HoverTip>
  ) : null;

  const SettingsButton = isMe ? (
    <HoverTip label={t.settings}>
      <button
        onClick={() => navigate('/settings' + location.search)}
        aria-label={t.settings}
        className="text-white/60 hover:text-white/90 transition-colors p-1 shrink-0"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </HoverTip>
  ) : null;

  // The opinio modal's vote strip, on the user's own numbers: agree-%, net
  // badge and the live-vs-lifetime sentiment bar, one component so the three
  // details cannot drift. The live counts are every opinio this user reported,
  // summed (the API does the SUM, not the 15 rows below), and the brackets are
  // the lifetime total_*_received the page always had - which used to be the
  // ONLY figure here, shown as a stacked ▲/▼ stat beside the bio. That stat
  // gave a lifetime number where the other two modals give a live one, so the
  // same user read differently depending on which card you opened.
  //
  // subject="user" re-words the agree panel to name the user's opinios; the
  // net panel is the country's (no "sorted by this" - nothing here is ranked).
  const VoteBlock = user && (
    <VoteHeadline
      likes={user.likesReceived}
      dislikes={user.dislikesReceived}
      totalLikes={user.totalLikesReceived}
      totalDislikes={user.totalDislikesReceived}
      subject="user"
    />
  );

  // Folds the opinio list away, leaving the header and the vote strip - the
  // same chevron the opinio and country modals fold with, on its own key.
  const CollapseButton = <CollapseDetailsButton collapsed={detailsCollapsed} onToggle={toggleDetails} />;

  const Actions = (
    <div className="flex items-center gap-1 shrink-0">
      {user && CollapseButton}
      {SettingsButton}
      {user && <ShareUserButton userId={user.id} displayName={user.displayName} />}
      <HoverTip label={t.close}>
        <button onClick={close} aria-label={t.close} className="text-white/60 hover:text-white/90 transition-colors p-1">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </HoverTip>
    </div>
  );

  // Speech bubble: the tail points left at the avatar so the bio reads as the
  // person saying it. Two stacked CSS triangles - the outer one is the border,
  // the inner one repeats the panel's rgba fill (not a solid colour) so it
  // blends identically over the sheet and the desktop modal, which sit on
  // different surfaces. The inner sits 1px further in to hide the panel's
  // left border where the tail meets it.
  const Bio = user?.bio ? (
    <div className="relative self-start max-w-full rounded-xl border border-border bg-white/[0.04] px-3 py-1.5">
      <span
        aria-hidden
        className="absolute w-0 h-0 border-y-[7px] border-y-transparent border-r-[7px] top-2.5 -left-[7px]"
        style={{ borderRightColor: 'var(--color-border)' }}
      />
      <span
        aria-hidden
        className="absolute w-0 h-0 border-y-[7px] border-y-transparent border-r-[7px] top-2.5 -left-[6px]"
        style={{ borderRightColor: 'rgba(255,255,255,0.04)' }}
      />
      <p className="text-sm text-white/80 leading-relaxed whitespace-pre-line break-words">{user.bio}</p>
    </div>
  ) : null;

  // Profile card, same shape at both sizes: the picture on the left, and
  // beside it the handle + actions, the join date, then the bio. Live bios
  // are short (one or two lines), so the column lands at about the picture's
  // height and the bio costs no row of its own. The vote numbers are not up
  // here - they are the strip below the header, where the other two modals
  // keep theirs. The avatar is larger than the opinio and country modals'
  // (96 vs 40 / 56): this page is about the person, so the picture leads -
  // unless there is neither a picture nor a bio, see largeAvatar above.
  // Google pictures load at 256px (googleAvatarAtSize) and new uploads are
  // stored at 256px; uploads older than that are 128px and slightly soft here
  // on 2x screens.
  const Header = user && (
    <div className="relative isolate flex items-start gap-3 min-w-0">
      {/* Colour wash, spilled out over the header's own padding; isolate +
          -z-10 keep it under the content but above the card's background. */}
      <div
        aria-hidden
        className={`user-header-wash absolute -z-10 pointer-events-none ${isMobile ? '-inset-x-4 -inset-y-3' : '-inset-x-6 -inset-y-4'}`}
        style={washStyle}
      />
      {BackToProfile}
      {largeAvatar ? (
        // 96px in all: a 3px sentiment ring, a 2px gap in the card's colour,
        // and the picture inside.
        <StatTip label={ringTipLabel} panel={ringTipPanel} width={280} className="!rounded-full shrink-0">
        <div
          className="sentiment-ring w-24 h-24 shrink-0 rounded-full p-[3px]"
          data-empty={likeShare === null}
          style={ringStyle}
        >
          <div className={`w-full h-full rounded-full p-[2px] ${isMobile ? 'bg-surface' : 'bg-surface-light'}`}>
            <Avatar
              name={user.displayName}
              imageUrl={avatarSrc}
              className="w-full h-full"
              isAnonymous={!hasAvatar}
              onLoadError={() => setFailedAvatarUrl(avatarSrc)}
            />
          </div>
        </div>
        </StatTip>
      ) : (
        <Avatar
          name={user.displayName}
          imageUrl={avatarSrc}
          className={`${isMobile ? 'w-10 h-10' : 'w-14 h-14'} shrink-0`}
          isAnonymous={!hasAvatar}
          onLoadError={() => setFailedAvatarUrl(avatarSrc)}
        />
      )}
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-nowrap min-w-0">
              {/* Just the handle - this is a profile card, and the searchable
                  context lives in <title> + description (the bio feeds the
                  latter when the user wrote one). */}
              <h1 className="font-semibold text-white truncate min-w-0">@{user.displayName}</h1>
              {user.countryCode && <CountryFlag code={user.countryCode} />}
            </div>
            <p className="text-[11px] text-white/60 truncate">{t.userJoined.replace('{date}', formatJoinDate(user.createdAt, locale))}</p>
          </div>
          {Actions}
        </div>
        {Bio}
      </div>
    </div>
  );

  // What the user did, newest first - posts and comments, one stream.
  const ProfilesList = user && (
    <UserActivityList
      items={user.activity ?? []}
      handle={user.displayName}
      isMe={isMe}
      onOpenProfile={openProfile}
      onOpenThread={openThread}
    />
  );

  const NotFoundView = (
    <div className="flex flex-col items-center justify-center text-center px-6 py-10">
      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
        <Avatar name="?" imageUrl={null} className="w-12 h-12" isAnonymous />
      </div>
      <p className="text-base font-semibold text-white mb-1">{t.userNotFoundTitle}</p>
      <p className="text-sm text-white/60 mb-5 max-w-xs">{t.userNotFoundBody}</p>
      <button
        onClick={close}
        className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-colors"
      >
        {t.userNotFoundCta}
      </button>
    </div>
  );

  const LoadingView = (
    <div className="px-6 py-10 text-center text-sm text-white/60">{t.loading}</div>
  );

  if (isMobile) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col justify-end"
        onClick={(e) => { if (e.target === e.currentTarget) close(); }}
      >
        <div className="absolute inset-0 bg-black/60" onClick={close} />
        {/* pb-11 reserves the votes bar's strip on the SHEET, not on the folded
            body, exactly as the country sheet does: the bar sits above every
            sheet (z-90) and the reservation has to survive the fold, or
            collapsing leaves the header itself underneath it. */}
        <div ref={sheetRef} className="relative bg-surface border-t border-border rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col pb-11">
          <div className="flex justify-center pt-3 pb-1 shrink-0" {...dragHandlers}>
            <div className="w-10 h-1 bg-white/20 rounded-full" />
          </div>
          <div className="px-4 py-3 border-b border-border shrink-0" {...dragHandlers}>
            {user ? Header : (
              <div className="flex items-center justify-between gap-1">
                <span className="text-sm font-semibold text-white/70 min-w-0 truncate">{notFound ? t.userNotFoundLabel : ''}</span>
                {Actions}
              </div>
            )}
          </div>
          {user && <div className="px-4 pt-3 pb-1 shrink-0">{VoteBlock}</div>}
          {/* Same fold as the country sheet (.details-fold, index.css): grid
              rows animate the sheet's own height, and min-h-0 keeps it a
              well-behaved flex child inside the max-h sheet. */}
          <div className="details-fold min-h-0" data-collapsed={detailsCollapsed}>
            <div>
              <div className="details-fold-inner overflow-y-auto overscroll-y-contain max-h-[60vh] px-4 pt-4 pb-4 space-y-4">
                {isLoading && LoadingView}
                {notFound && NotFoundView}
                {user && ProfilesList}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end items-center pointer-events-none">
      <div className="absolute bottom-0 left-0 right-0 h-[55vh] bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      <div className="bg-surface-light border border-border rounded-2xl shadow-2xl w-full max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl mx-4 flex flex-col max-h-[calc(100dvh-10rem)] mb-16 overflow-hidden pointer-events-auto">
        <div className="px-6 py-4 border-b border-border shrink-0">
          {user ? Header : (
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-white/70 flex-1">{notFound ? t.userNotFoundLabel : isLoading ? t.loading : ''}</span>
              {Actions}
            </div>
          )}
        </div>
        {user && <div className="px-6 pt-4 pb-3 border-b border-border shrink-0">{VoteBlock}</div>}
        {isLoading && LoadingView}
        {notFound && NotFoundView}
        {user && (
          // Same fold as the country card. The card is anchored to the bottom
          // of the screen (justify-end + mb-16), so folding pulls it DOWN and
          // uncovers the map from the top.
          <div className="details-fold min-h-0" data-collapsed={detailsCollapsed}>
            <div>
              {/* Four rows at Full HD, then scroll - the country card's
                  arithmetic (see CountryDetailModal, which carries the full
                  derivation): 350px is four 66px rows plus label, padding and
                  a sliver of the fifth; above 1080px tall the list takes half
                  the extra height up to eight rows (602px); the dvh term keeps
                  a short window honest. Keep this class identical to the
                  country card's. Was a free-height list that grew to all 15
                  rows, on top of the map. */}
              <div className="details-fold-inner overflow-y-auto subtle-scrollbar max-h-[min(max(350px,calc(50dvh-190px)),calc(100dvh-21rem),602px)] px-6 py-4">
                {ProfilesList}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
