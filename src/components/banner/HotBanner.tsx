import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Avatar } from '../profile/Avatar';
import { RoleBadge } from '../common/RoleBadge';
import { useRealtimeFeed } from '../../hooks/useRealtimeFeed';
import { useI18n } from '../../i18n/I18nContext';
import { CountryFlag, FlagImg } from '../common/CountryFlag';

const FADE_IN_MS = 500;
const HOLD_MS = 10_000;
const FADE_OUT_MS = 500;
const GAP_MS = 3_000;

type Phase = 'in' | 'hold' | 'out' | 'gap';

// The two things the live slot announces. Same card, timing and behaviour;
// the accent and the label tell them apart at a glance - orange is the
// app's "new" signal and stays with opinios. News takes the brand red as a
// broadcast-style LIVE pill: the pill's text is the lifted red, since
// --color-accent itself sits just under 4.5:1 on the navy.
const VARIANTS = {
  opinio: {
    border: 'border-orange-500/70',
    label: 'text-orange-400',
    dot: 'bg-orange-400',
    shadow: '0 0 0 1px rgba(249,115,22,0.35), 0 10px 30px -10px rgba(249,115,22,0.55), 0 18px 50px -20px rgba(0,0,0,0.6)',
  },
  news: {
    border: 'border-accent/70',
    label: 'text-negative-soft bg-accent/15 border border-accent/60 rounded-full px-2 py-0.5',
    dot: 'bg-accent',
    shadow: '0 0 0 1px rgba(233,69,96,0.35), 0 10px 30px -10px rgba(233,69,96,0.55), 0 18px 50px -20px rgba(0,0,0,0.6)',
  },
} as const;

export function HotBanner({
  enabled,
  mobile = false,
  onVisibilityChange,
}: {
  enabled: boolean;
  mobile?: boolean;
  // Desktop only: the map caption sits in this exact slot and is 20px taller
  // than this card, so covering it left a strip of caption poking out below.
  // It yields instead - see MapProfileTitle's `suppressed`.
  onVisibilityChange?: (visible: boolean) => void;
}) {
  const { next, dequeue, queueLength } = useRealtimeFeed(enabled);
  const navigate = useNavigate();
  const location = useLocation();
  const { t, locale } = useI18n();
  const [phase, setPhase] = useState<Phase>('in');
  // The news item (by id) the reader switched to its English original. Keyed
  // by id, so the next item starts translated again without an effect.
  const [originalFor, setOriginalFor] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);
  const hoveredRef = useRef(false);
  hoveredRef.current = hovered;
  const [dismissed, setDismissed] = useState(false);
  const prevQueueLen = useRef(queueLength);

  // Reset to fade-in whenever a new item arrives.
  useEffect(() => {
    if (!next) return;
    setPhase('in');
  }, [next]);

  // Mobile tap-to-dismiss hides the banner; bring it back only when a
  // genuinely new profile arrives (queue grows). Advancing the queue head via
  // dequeue shrinks the queue, so it must not clear the dismissal.
  useEffect(() => {
    if (queueLength > prevQueueLen.current) setDismissed(false);
    prevQueueLen.current = queueLength;
  }, [queueLength]);

  // One timer per phase. Hovering does NOT freeze the chain - a notification
  // that outlives its own timer because the cursor happens to rest on it has no
  // way out on desktop (there is no dismiss control, and clicking navigates).
  // The cursor only holds the card *on screen*: it stays fully opaque, the
  // phases keep advancing underneath, and the queue is not advanced until the
  // pointer leaves (see onHoverEnd) so the content cannot swap under the cursor.
  useEffect(() => {
    if (!next) return;
    const ms =
      phase === 'in' ? FADE_IN_MS :
      phase === 'hold' ? HOLD_MS :
      phase === 'out' ? FADE_OUT_MS :
      GAP_MS;
    const timer = window.setTimeout(() => {
      if (phase === 'in') setPhase('hold');
      else if (phase === 'hold') setPhase('out');
      else if (phase === 'out') setPhase('gap');
      else if (!hoveredRef.current) dequeue();
    }, ms);
    return () => clearTimeout(timer);
  }, [next, phase, dequeue]);

  // During the 3s gap the banner must not exist in DOM — otherwise its
  // (invisible at opacity 0) hitbox would capture clicks and navigate to the
  // profile that just faded out. The hover exception is safe for exactly that
  // reason: a held card is painted at full opacity, so a click on it lands on
  // the profile the reader can see.
  const showBanner = !!(enabled && next && (phase !== 'gap' || hovered) && !dismissed);

  useEffect(() => {
    onVisibilityChange?.(showBanner);
  }, [showBanner, onVisibilityChange]);

  // Unmounting (route change, width change) must not leave the caption hidden.
  useEffect(() => () => onVisibilityChange?.(false), [onVisibilityChange]);

  // Mobile-only: any tap dismisses the banner. A tap on the card also opens
  // the profile via its own onClick; a tap anywhere else just clears it.
  // Drop it from the queue too, so a backlog item doesn't pop straight back up.
  useEffect(() => {
    if (!mobile || !showBanner) return;
    const onDocClick = () => {
      setDismissed(true);
      dequeue();
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [mobile, showBanner, dequeue]);

  const onHoverStart = () => setHovered(true);
  // The timer ran while the cursor sat here, so an already-expired banner goes
  // the moment the pointer leaves; one still mid-flight just resumes its phase.
  const onHoverEnd = () => {
    setHovered(false);
    if (phase === 'gap') dequeue();
  };

  if (!showBanner) return null;

  // An opinio opens its detail. A news item has no page of its own yet, so it
  // opens the article it was written from.
  const go = next.kind === 'opinio'
    ? () => navigate('/p/' + next.profile.id + location.search)
    : () => window.open(next.news.sourceUrl, '_blank', 'noopener,noreferrer');
  const v = VARIANTS[next.kind];
  // Same "See original" toggle as the opinio detail: news text is machine
  // translated, and this is where a reader can check it.
  const translated = next.kind === 'news' && locale !== 'en'
    && (next.news.title !== next.news.originalTitle || next.news.body !== next.news.originalBody);
  const showingOriginal = translated && next.kind === 'news' && originalFor === next.news.id;
  const card = next.kind === 'opinio'
    ? { name: next.profile.name, imageUrl: next.profile.imageUrl, title: next.profile.name,
        text: next.profile.description, role: next.profile.role, countryCode: next.profile.countryCode,
        label: t.justReported, source: null }
    : { name: next.news.person.name, imageUrl: next.news.person.photoUrl,
        title: showingOriginal ? next.news.originalTitle : next.news.title,
        text: showingOriginal ? next.news.originalBody : next.news.body, role: next.news.role, countryCode: next.news.countryCode,
        label: t.newsLabel, source: next.news.sourceName };
  // A news item whose person has no photo yet shows its country's flag as the
  // picture; the inline flag after the title would then say it twice.
  const flagAsPicture = next.kind === 'news' && !card.imageUrl;
  const inAnim = mobile ? 'hot-banner-in-up' : 'hot-banner-in';
  const outAnim = mobile ? 'hot-banner-out-down' : 'hot-banner-out';
  // Held under the cursor: no animation and a pinned opacity, so a card whose
  // fade-out started (or finished) while hovered reads as fully present.
  const animation =
    hovered
      ? undefined
      : phase === 'in'
        ? `${inAnim} ${FADE_IN_MS}ms ease-out forwards`
        : phase === 'out'
          ? `${outAnim} ${FADE_OUT_MS}ms ease-in forwards`
          : undefined;

  return (
    <div
      className={
        mobile
          ? 'px-2 pb-2 pointer-events-none'
          : 'absolute left-1/2 -translate-x-1/2 top-2 z-20 w-[min(90vw,max(700px,60%))] pointer-events-none'
      }
      data-testid="hot-banner-wrapper"
    >
      <div
        role="link"
        tabIndex={0}
        aria-label={`Open ${card.title}`}
        onClick={go}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } }}
        onMouseEnter={mobile ? undefined : onHoverStart}
        onMouseLeave={mobile ? undefined : onHoverEnd}
        data-testid="hot-banner"
        className={`cursor-pointer border ${v.border} rounded-2xl
                   flex items-center select-none ${mobile ? 'gap-3 px-4 py-3' : 'gap-4 px-5 py-3.5'}
                   transition-colors pointer-events-auto ${
                     mobile
                       ? 'bg-surface/90 backdrop-blur-sm hover:bg-surface/95'
                       : 'bg-surface/85 backdrop-blur-md hover:bg-surface/95'
                   }`}
        style={{
          animation,
          opacity: hovered || phase === 'hold' ? 1 : undefined,
          boxShadow: v.shadow,
        }}
      >
        {/* Same anatomy as the sidebar card (ProfileCard): avatar, then the
            title with its flag and category inline after it, then the text.
            The banner sits a size up from the card, and another step up on
            very wide screens, where it also widens with the map. */}
        {flagAsPicture ? (
          <div
            aria-hidden
            className={`shrink-0 rounded-full ring-2 ring-white/5 bg-white/[0.06] flex items-center justify-center ${mobile ? 'w-12 h-12' : 'w-14 h-14 min-[2200px]:w-16 min-[2200px]:h-16'}`}
          >
            <FlagImg code={card.countryCode} size={mobile ? 26 : 30} />
          </div>
        ) : (
          <Avatar
            name={card.name}
            imageUrl={card.imageUrl}
            className={`shrink-0 ring-2 ring-white/5 ${mobile ? 'w-12 h-12' : 'w-14 h-14 min-[2200px]:w-16 min-[2200px]:h-16'}`}
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 min-w-0">
            <div className={`shrink-0 uppercase font-bold ${v.label} ${mobile ? 'text-[11px] tracking-widest' : 'text-xs tracking-[0.16em] min-[2200px]:text-sm'}`}>
              <span className={`inline-block rounded-full ${v.dot} mr-1.5 align-middle animate-pulse ${mobile ? 'w-1.5 h-1.5' : 'w-2 h-2'}`} />
              {card.label}
            </div>
            {/* News credits the outlet its facts came from. */}
            {card.source && <span className={`text-white/50 truncate ${mobile ? 'text-[11px]' : 'text-xs min-[2200px]:text-sm'}`}>{card.source}</span>}
            {/* Swaps the text in place; it must not open the article, nor
                count as the mobile tap that dismisses the banner. */}
            {translated && next.kind === 'news' && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setOriginalFor(showingOriginal ? null : next.news.id); }}
                className={`shrink-0 text-white/50 hover:text-white underline-offset-2 hover:underline transition-colors ${mobile ? 'text-[11px]' : 'text-xs min-[2200px]:text-sm'}`}
              >
                {showingOriginal ? t.seeTranslation : t.seeOriginal}
              </button>
            )}
          </div>
          <div className="flex items-center gap-x-1.5 gap-y-0.5 flex-wrap min-w-0">
            {/* Two lines at most: a translated news title runs up to ~1.8x
                the English one, which is capped to fit one desktop line. */}
            <span className={`font-semibold text-white leading-snug break-words min-w-0 line-clamp-2 ${mobile ? 'text-sm' : 'text-lg min-[2200px]:text-xl'}`}>
              {card.title}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              {!flagAsPicture && <CountryFlag code={card.countryCode} tip={false} />}
              <RoleBadge role={card.role} />
            </div>
          </div>
          <p className={`text-text-secondary leading-snug mt-0.5 ${mobile ? 'text-xs line-clamp-1' : 'text-sm line-clamp-2 min-[2200px]:text-base'}`}>
            {card.text}
          </p>
        </div>
      </div>
    </div>
  );
}
