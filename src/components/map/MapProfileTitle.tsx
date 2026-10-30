import { useEffect, useMemo, useRef, useState, type AnimationEvent, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useFilters } from '../../context/useFilters';
import { getCountryName } from '../../utils/countries';
import { Avatar } from '../profile/Avatar';
import { FlagImg } from '../common/CountryFlag';
import { HoverTip } from '../common/HoverTip';
import { AiMark } from '../news/NewsBits';
import { RoleBadge } from '../common/RoleBadge';
import { useI18n } from '../../i18n/I18nContext';
import { useSubjectSwap } from '../../hooks/useSubjectSwap';
import { useLatestNews } from '../../hooks/useLatestNews';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import type { Profile } from '../../types/profile';
import type { NewsItem } from '../../types/api';
import { LogoMark } from '../common/LogoMark';
import { formatRelativeTime } from '../../utils/formatRelativeTime';

// What the caption is currently about. The two subject kinds are the two
// voter-side map tints (see WorldMap): one opinio, or one country's opinios.
export type CaptionSubject =
  | { kind: 'profile'; key: string; profile: Profile }
  | { kind: 'country'; key: string; code: string; name: string };

// A slide of the default state's rotation: the news kind exists only there.
type Shown = CaptionSubject | { kind: 'news'; key: string; news: NewsItem };

// The default state rotates: the Opinio mark first - it is what a new visitor
// should read before anything else - then the five newest news items (the
// last 12 hours), 10s each, then the mark again. No news, no rotation. It
// holds while the pointer is on the card and while HotBanner has the slot, and
// never advances by itself under reduced motion; the dots switch by hand.
//
// Holding pauses the slide's clock, it does not restart it: moving the pointer
// across the card on the way to the map used to hand the slide a fresh 10s
// every time.
//
// One cycle for the whole visit, and opening or closing a detail never moves
// it - like the sidebars behind a detail, which stay where they were. A detail
// only changes what the FIRST slot holds (the mark, the opinio, the country):
// if that slot is up, it crossfades to the new subject and gets a fresh 10s
// (the change was asked for, so it is not the banner moving by itself); if a
// news item is up, nothing on screen changes and the new subject waits for its
// turn. So the caption can name something other than the tint for a while -
// accepted: the modal and the sidebars name the opinio, and the X sits on the
// card through the news. A fresh load always starts on the first slot, so a
// first visit and a crawler still get the opinio's h1 / home's h2 there.
const SLIDE_MS = 10_000;
const SUBJECT_SLOT = 'subject';

// The caption above the map. Three states, same slot:
//
//   default  - the Opinio mark + wordmark under a line naming what the global
//              map shows. Always there, on the home map and on a detail whose
//              tint has been dismissed; no close button, nothing to return to.
//   profile  - the open opinio's avatar + name, with a close button.
//   country  - the open country's flag + name, with a close button.
//
// The last two share everything but the mark and the heading level, because they
// caption the same kind of map: "here is where the votes on THIS came from". The
// kicker is literally the same string for both (t.mapWorldThinks) - it takes no
// preposition, so it sits under either subject unchanged (see below).
//
// Closing the profile or country caption does NOT close the modal (WorldMap owns
// that state): the detail stays open and readable while the map and this caption
// drop back to the global default, which is the only way to look at the world
// map while a detail is open.
//
// In PROFILE state the name is an h1 and the kicker above it an h2.
// DesktopProfileModal carries its own h1 for the same opinio, so above 1366 the
// route has two - deliberate, see the CLAUDE.md note: the map does not render
// below 1366, and the modal heading is what guarantees the route always has one.
// The crawler-visible heading on a bare /p/<id> comes from the SPA (the worker
// only injects <head> there), which is why this one is worth carrying at all.
//
// In COUNTRY state NEITHER line is a heading - both are plain spans - and that
// is not an oversight. CountryDetailModal always carries an h1 (the localized
// "{country}: what the world thinks", keyword-front-loaded and crawler-visible
// at every width, unlike the profile modal's), so a heading here would be pure
// duplication. Worse, it would be duplication in the wrong order: this caption
// renders BEFORE the router Outlet, so an h2 kicker here would run ahead of the
// modal's h1 in the outline - the very thing the flex-col-reverse below exists
// to prevent inside the card. One h1 per country route, and the modal owns it.
//
// In the default state only the descriptive line is a heading (h2) and the
// wordmark is a plain span: on the home page the h1 is the wordmark in FilterBar
// and must stay that way, while the h2 gives home its first *content* heading -
// real words about what the map is, which it otherwise has none of. `uppercase`
// is text-transform, so the crawled text keeps its normal casing.
//
// That line describes the map it sits over, and the states do NOT show the same
// thing: the global map groups by profiles.country_code (what an opinio is
// about), the two subject maps by voter country. Hence "how the world sees each
// country" there and "what the world thinks" here - not one shared phrase.
//
// The kicker takes NO preposition ("what the world thinks", not "...thinks about
// X"). Czech and Polish would need the name inflected after one, and names never
// inflect - the same reason the country SEO templates lead with the subject, and
// the reason one kicker string covers both an opinio and a country with nothing
// added. "Czechia" over "what the world thinks" is the same sentence the country
// page's own title makes ("{country}: what the world thinks"), in the same order.
//
// Sits in a card matching the opinio cards in the sidebars (ProfileCard.tsx:243:
// rounded-xl, bg-surface-light, hairline white ring) so it reads as part of the
// same family - just larger. Slightly more opaque than a sidebar card plus a
// backdrop blur, because this one sits over the map rather than a flat panel.
// The card spans the full width of the map column (the sidebars are resizable, so
// "available width" is whatever the column currently is) rather than hugging the
// name - a content-width box jumped around as you moved between opinios.
//
// Layout is the avatar and the text column as ONE centred group, not a text cell
// centred inside a full-width card. The distinction is the whole point: a
// full-width cell centres its text in the middle of the card and leaves the
// avatar stranded at the left edge with a gap between them, which reads as a bug
// at every width wider than the name. Here the column is sized to its content
// (no flex-1) and shrinks only once the name needs the room, so the avatar always
// sits directly beside the text.
//
// The name is NOT balanced across its two lines. `text-balance` splits them
// evenly, which on a centred block re-opens the same gap - a name a hair too long
// for one line becomes two half-width lines floating away from the avatar.
// Greedy wrapping fills the first line to the column edge, so the text starts
// beside the avatar and only the shorter last line is centred under it.
//
// The name is NOT fitted to the string. Size comes from the card's own width
// (`cqi`, hence the `@container`), so every opinio is captioned at the same size
// at the same window size - a per-string fit made one name 30px and the next 22px
// on an unchanged layout, and the caption is the same object either way. Long
// names wrap instead, and the width freed by dropping the old centred text cell
// makes that rare: a 40-char statement - the input cap - holds one line at a Full
// HD map column, and only a translation that runs well past it takes a second.
//
// pointer-events-none on the wrapper: it overlays the map and must never eat a
// country hover. The close button re-enables them for itself alone.
//
// Changing subject is animated as a crossfade in place, not a re-render: the
// outgoing row sinks out while the incoming one rises in, both at once, inside
// one grid cell. useSubjectSwap holds the two subjects; each row is keyed on its
// own, so the animations replay every time, and the global state shares the key
// space with the opinios - global -> opinio animates exactly like opinio ->
// opinio.
//
// What crossfades is the ROWS, not the card. Stacking two whole cards doubles a
// translucent background, a hairline ring and a shadow for the length of the
// swap, which reads as the caption darkening every time you open an opinio.
// The shell - background, blur, ring, padding, container query - stays put as one
// object and its contents change, which is also the truer description of what
// this thing is.
//
// The two must overlap rather than queue. Measured against a click, a
// leave-then-enter sequence settled ~450ms after the profile modal it captions
// (170ms of leave before 340ms of enter, plus the mark/name stagger) and read as
// the caption trailing the modal; overlapped, both land within ~50ms of each
// other. Same reason the leave is the shorter of the two: it is spending its
// time underneath the arriving subject, not in front of the reader.

// py-[14px] rather than the 12 a py-3 would give: the extra 2px top and bottom
// buy the row breathing room AND drop the title's first line clear of the close
// button's 34px corner, which is what the padding used to be inflated to solve.
// The shell: everything that stays put while the subject changes - the surface,
// the ring, the blur, the padding, and the container query the type is sized
// from. It holds no layout of its own beyond the stack; the row does that.
//
// One fixed height for every state (min-h on the stack), sized for the news
// row - label, two-line title, two lines of text - so the card never jumps as the
// rotation or the subject changes. It grows with the card's width, since a wide
// card has the room to say more: at 1366-1536 (460px card) the title takes two
// lines and so does the text - one line of text there was all a MacBook (1440,
// 1512) ever showed of it; from 700px of card (Full HD) the title holds one
// line; from 900px the text steps up a size, and from 1100px (2560 and up) the
// picture and the type do as well. Each minimum is the tallest news row
// measured at that size, so no slide makes the card grow.
const CARD =
  '@container relative isolate w-full rounded-xl backdrop-blur-md ring-1 shadow-xl shadow-black/20 px-5 py-[14px] transition-[background-color,box-shadow] duration-200';
const STACK_HEIGHT = 'min-h-[116px] @[700px]:min-h-[112px] @[900px]:min-h-[120px] @[1100px]:min-h-[128px]';

// One subject's row inside the shell.
const ROW = 'flex w-full items-center justify-center gap-4';

// Both rows occupy the same grid cell, so the outgoing one keeps its place under
// the incoming one for the length of the crossfade instead of being laid out
// beside it. Grid rather than absolute positioning: the cell still takes part in
// sizing, so the shell keeps the row's height with no explicit height anywhere.
const STACK = '[grid-area:1/1]';

// The avatar's mirror on the far side. Without it the centred group is the avatar
// PLUS the text, so the text itself sits half an avatar right of the card's
// centre line - visible at any width, and the thing that made the caption look
// subtly off. With it the text column is centred on the card and the avatar hugs
// its left edge. It is not the old fixed 52px track, though - it is the ONLY
// shrinkable item in the row, so a name that needs the width takes all of it back
// and only then does the group go flush.
//
// "Only" is load-bearing, and it cannot be done with a shrink factor. Flex splits
// a deficit across every shrinkable item in proportion to basis x factor, so
// however large a factor this spacer carries, the text column still absorbs a
// sliver - and a sliver is all it takes to wrap a line. Measured on the live page:
// a 686px card left the spacer holding 19px while the column sat at 543 against a
// name that needed 543.x, so the last word dropped to a second line with the room
// to fit it sitting right there, unused. The column is shrink-0 and bounded by a
// max-width instead, which leaves this the only item that can yield.
const SPACER = 'w-[64px] @[700px]:w-[76px] @[1100px]:w-[88px]';

// flex-col-REVERSE keeps the source order h1-then-h2 while the kicker still
// renders above the name, so the heading outline never runs an h2 ahead of the
// h1. No flex-1, so a short name leaves the group hugging its own width and
// centred.
//
// shrink-0 with a max-width rather than a shrink factor - see SPACER for why. The
// bound is the row's own arithmetic: 100% is the card's content box, less the
// picture (64/76/88px, see PROMO_MARK) and the two 16px gaps, which is exactly
// what the column can occupy once the spacer has collapsed. Keep it in step with
// the picture size and the row gap.
const COLUMN =
  'flex min-w-0 shrink-0 max-w-[calc(100%-96px)] @[700px]:max-w-[calc(100%-108px)] @[1100px]:max-w-[calc(100%-120px)] flex-col-reverse items-center gap-0.5 text-center';

const NAME = 'font-extrabold tracking-tight leading-[1.15]';

// Clamped so the caption never outgrows the card on an ultrawide column nor
// collapses on a narrow one; between those it tracks the column.
// Set a step up from the original 18-30px with the taller card the rotation
// brought, so an opinio or a country reads at the same scale as the promo and
// the news beside it. Below the promo's own wordmark size: these are names of
// up to 40 characters, not a five-letter word.
const NAME_SIZE = 'clamp(22px, 4.8cqi, 40px)';

// The kicker tracks the column too, and for the same reason: at a 1400px window
// the longest of them ("live world opinion on every country") wrapped its last
// word onto a second line while the card still had room around it. leading-5 is
// fixed on purpose - the row's height must not move with the font size, because
// the close button's clearance is measured from it.
const KICKER = 'font-semibold uppercase tracking-[0.16em] leading-5 text-white/50';
const KICKER_SIZE = 'clamp(11px, 2.4cqi, 16px)';

// Every state fills the taller card the news rotation needs: the picture (the
// mark, an opinio's avatar, a country's flag) grows with it, so no state sits
// as a small island in a large card. The spacer mirrors the picture at each
// size to keep the text centred (see SPACER).
const PROMO_MARK = 'w-[64px] h-[64px] @[700px]:w-[76px] @[700px]:h-[76px] @[1100px]:w-[88px] @[1100px]:h-[88px]';
const PROMO_NAME_SIZE = 'clamp(26px, 5.6cqi, 44px)';
const PROMO_KICKER_SIZE = KICKER_SIZE;

export function MapProfileTitle({
  subject,
  onDismiss,
  suppressed = false,
}: {
  subject: CaptionSubject | null;
  onDismiss: () => void;
  // HotBanner lands in this same slot on the home map. It is ~20px shorter than
  // this card, so layering it on top left a strip of caption visible underneath;
  // the caption steps aside for it instead, and slides back when it leaves.
  suppressed?: boolean;
}) {
  const { t } = useI18n();
  const reducedMotion = useReducedMotion();
  // Every state rotates the same way: what the caption is about - the mark on
  // the global map, the open opinio or country on a detail - is the first
  // slide, then the news. The subject's dismiss X stays on the card through the
  // news slides, since the map stays tinted for the subject all the while.
  const subjectKey = subject?.key ?? 'global';
  const { data: latest } = useLatestNews(true);
  // Memoized, not rebuilt per render: useSubjectSwap compares the shown value by
  // identity, so a fresh news-slide object on every render made it set state on
  // every commit - an endless re-render that starved the router's navigation
  // transition (a map or flag click changed the URL and nothing opened).
  const slides = useMemo<(Shown | null)[]>(
    () => [subject, ...(latest?.items ?? []).map((n) => ({ kind: 'news' as const, key: 'n:' + n.id, news: n }))],
    [subject, latest],
  );
  // The slide is followed by its key, not its position: a new item enters the
  // list at the top and shifts every news slide down one, and a position would
  // swap the story on screen mid-turn (it then got a few seconds, and the next
  // turn showed it again). A key that left the list (aged out) restarts at the
  // first slot. The first slot's key is SUBJECT_SLOT whatever it holds, which is
  // what keeps the cycle's place when the subject changes.
  const [slideKey, setSlideKey] = useState(SUBJECT_SLOT);
  const [hovered, setHovered] = useState(false);
  // Bumped to give the slide on screen a fresh clock without moving the cycle.
  const [turn, setTurn] = useState(0);
  // A new subject while the first slot is up: the swap's snap and a fresh 10s
  // (see the note at SLIDE_MS); otherwise nothing. Adjusted during render
  // rather than in an effect, which would paint one frame of the old slide.
  const [lastSubjectKey, setLastSubjectKey] = useState(subjectKey);
  const [snap, setSnap] = useState(false);
  if (lastSubjectKey !== subjectKey) {
    setLastSubjectKey(subjectKey);
    if (slideKey === SUBJECT_SLOT) {
      setSnap(true);
      setTurn((n) => n + 1);
    }
  }
  // A dot is a click, so it gets the click's snap: the reader is waiting for
  // the story they picked, not watching the rotation's slow dissolve.
  const goTo = (key: string) => { setSnap(true); setSlideKey(key); setTurn((n) => n + 1); };
  const keyOf = (x: Shown | null, i: number) => (i === 0 ? SUBJECT_SLOT : x?.key ?? SUBJECT_SLOT);
  const at = Math.max(0, slides.findIndex((x, i) => keyOf(x, i) === slideKey));
  const nextKey = keyOf(slides[(at + 1) % slides.length], (at + 1) % slides.length);
  const paused = hovered || suppressed || reducedMotion || slides.length < 2;
  // The time the slide on screen has already been up, so a hold resumes it
  // rather than restarting it. One entry is enough: a slide that is left starts
  // from zero the next time round.
  const spentRef = useRef({ key: '', ms: 0 });
  const progressRef = useRef<HTMLSpanElement>(null);
  const clockKey = slideKey + '#' + turn;
  // The timer and the progress pill run off the same clock: the pill's CSS
  // animation is seeked to the time spent and paused with the timer, so it
  // holds where it is instead of emptying.
  useEffect(() => {
    const clock = spentRef.current;
    const spent = clock.key === clockKey ? clock.ms : 0;
    const pill = progressRef.current;
    const anim = pill?.getAnimations()[0];
    if (anim) { anim.currentTime = spent; anim.pause(); }
    if (paused) return;
    anim?.play();
    const since = performance.now();
    let done = false;
    const timer = setTimeout(() => {
      done = true;
      setSnap(false);
      setSlideKey(nextKey);
    }, Math.max(0, SLIDE_MS - spent));
    return () => {
      clearTimeout(timer);
      // Only while the pill is still on the page. This cleanup also runs after
      // an unmount, and pausing an animation whose element is already removed
      // revives it on the document timeline, which then keeps the whole
      // detached caption alive - one copy leaked per map unmount or slide.
      if (pill?.isConnected) anim?.pause();
      clock.key = done ? '' : clockKey;
      clock.ms = done ? 0 : spent + performance.now() - since;
    };
  }, [paused, clockKey, nextKey]);
  const shown: Shown | null = slides[at];
  // Subject keys are namespaced by kind ('p:<id>' / 'c:<CODE>' / 'n:<id>'), so
  // an opinio, a country and a news item can never collide and moving between
  // them crossfades like any other subject change.
  // The rotation's dissolve outlasts the swap's default 600ms failsafe.
  const { current, outgoing, endOutgoing } = useSubjectSwap(shown?.key ?? 'global', shown, 1_000);
  // A click (subject change or dot) snaps; the rotation dissolves.
  const enter = snap ? 'caption-enter' : 'caption-slide-enter';
  const leave = snap ? 'caption-leave' : 'caption-slide-leave';
  // The outgoing row is dropped the moment its own animation reports finished.
  // caption-enter and the staggered mark/name animations bubble to this same
  // handler from the row beside it, so the name has to be checked.
  const onRowAnimationEnd = (e: AnimationEvent) => {
    if (e.animationName === 'caption-leave' || e.animationName === 'caption-slide-out') endOutgoing();
  };
  return (
    <div
      className={`absolute top-4 left-0 right-0 z-10 px-4 pointer-events-none select-none transition-all duration-300 ease-out ${
        suppressed ? 'opacity-0 -translate-y-3' : 'opacity-100 translate-y-0'
      }`}
      aria-hidden={suppressed}
    >
      {/* The card takes the pointer only while it rotates news: hovering holds
          the slide and a news row opens its article. Otherwise it stays
          transparent to the map under it. */}
      <div
        className={`${CARD} ${slides.length > 1 ? 'pointer-events-auto' : ''} ${
          hovered ? 'bg-surface-light/80 ring-white/25' : 'bg-surface-light/60 ring-white/[0.08]'
        }`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Hover holds the rotation, and the card says so: a firmer surface and
            ring, plus the sidebar card's corner glow in the news pill's red while a
            news slide is up. No lift - the card itself opens nothing. */}
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 -z-10 rounded-[inherit] transition-opacity duration-300 ${
            hovered && current.value?.kind === 'news' ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ background: 'radial-gradient(120% 80% at 0% 0%, rgba(233,69,96,0.24), transparent 65%)' }}
        />
        {/* One grid cell holding both rows (see STACK), so the outgoing subject
            fades out over the incoming one instead of before it. Its height is
            the taller of the two, which for equal-height rows is simply the row
            height - the shell never jumps mid-swap. */}
        <div className={`grid w-full items-center ${STACK_HEIGHT}`}>
          {outgoing && (
            <CaptionRow
              key={outgoing.key}
              subject={outgoing.value}
              motion={leave}
              onAnimationEnd={onRowAnimationEnd}
            />
          )}
          <CaptionRow key={current.key} subject={current.value} motion={enter} />
        </div>
        {/* Lives on the shell, not in a row: it belongs to whatever the caption
            is about NOW, and a copy riding the outgoing row would leave two Xs
            stacked for the length of the swap. */}
        {slides.length > 1 && (
          <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-1">
            {slides.map((s, i) => (
              <button
                key={keyOf(s, i)}
                type="button"
                onClick={() => goTo(keyOf(s, i))}
                aria-label={s?.kind === 'news' ? s.news.title : s?.kind === 'profile' ? s.profile.name : s?.kind === 'country' ? s.name : t.appName}
                aria-current={i === at || undefined}
                className="p-1.5"
              >
                {/* The active dot stretches into a pill that fills over the
                    slide's 10s. Held (hover, banner) it stops where it is and
                    goes on from there on release, with the timer. Reduced
                    motion has no timer, so the pill is simply full. */}
                <span
                  className={`relative block h-2 rounded-full overflow-hidden bg-white/25 transition-[width,background-color] duration-500 ease-out ${
                    i === at ? 'w-7' : 'w-2 hover:bg-white/45'
                  }`}
                >
                  {i === at && (
                    reducedMotion ? (
                      <span className="absolute inset-0 bg-white/70" />
                    ) : (
                      <span
                        key={clockKey}
                        ref={progressRef}
                        className="absolute inset-0 bg-white/70 caption-progress"
                        style={{ animationDuration: `${SLIDE_MS}ms` }}
                      />
                    )
                  )}
                </span>
              </button>
            ))}
          </div>
        )}
        {subject && (
          <span className="pointer-events-auto absolute top-1.5 right-1.5">
            <HoverTip label={t.mapShowGlobal}>
              <button
                onClick={onDismiss}
                aria-label={t.mapShowGlobal}
                className="text-white/40 hover:text-white/80 transition-colors p-1"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </HoverTip>
          </span>
        )}
      </div>
    </div>
  );
}

// One subject's worth of caption: the mark, the name and the kicker under it.
// Rendered once per live subject - two of them during a crossfade - and given
// the animation to play by its caller.
//
// aria-hidden on a leaving row: for those ~170ms the caption has two names in
// it, and only one of them is what the map is showing.
function CaptionRow({
  subject,
  motion,
  onAnimationEnd,
}: {
  subject: Shown | null;
  motion: string;
  onAnimationEnd?: (e: AnimationEvent) => void;
}) {
  const { t } = useI18n();
  const leaving = motion === 'caption-leave' || motion === 'caption-slide-leave';
  if (subject?.kind === 'news') {
    return (
      <div className={`${STACK} ${motion}`} onAnimationEnd={onAnimationEnd} aria-hidden={leaving || undefined}>
        <NewsRow news={subject.news} />
      </div>
    );
  }
  return (
    <div className={`${STACK} ${ROW} ${motion}`} onAnimationEnd={onAnimationEnd} aria-hidden={leaving || undefined}>
      {subject?.kind === 'profile' ? (
        /* Two sibling headings, not one h1 around both: the kicker is an h2 and
           cannot legally nest inside an h1, and splitting them leaves the h1's
           text as exactly the opinio name instead of "what the world thinks
           <name>". */
        <>
          <Avatar
            name={subject.profile.name}
            imageUrl={subject.profile.imageUrl}
            className={`caption-mark ${PROMO_MARK} shrink-0 ring-2 ring-white/10 [&>span]:text-xl @[1100px]:[&>span]:text-2xl`}
          />
          <div className={`${COLUMN} caption-text`}>
            <h1 style={{ fontSize: NAME_SIZE }} className={`${NAME} text-white`}>
              {subject.profile.name}
            </h1>
            {/* One line, whatever the data says. This is a caption naming the
                caption's subject, not a status bar: a brand-new opinio paints a
                blank map because nobody has voted yet, and the sidebars and the
                modal below already report that. Swapping the kicker to an empty
                state made the caption change its job depending on the numbers. */}
            <h2 style={{ fontSize: KICKER_SIZE }} className={KICKER}>
              {t.mapWorldThinks}
            </h2>
          </div>
        </>
      ) : subject?.kind === 'country' ? (
        /* Same row, same slots, same type as the other two - the flag takes the
           mark's place. Plain spans, not headings: the country modal below owns
           this route's only h1 (see the note at the top of the file).

           The flag sits in a round tile the size of the profile avatar rather
           than floating at its natural glyph size, so the three states share one
           silhouette and the row never changes height. ring-2 ring-white/10
           matches the avatar's, and the tile is what gives the emoji branch a
           consistent box - flag emoji are wider than they are tall and vary by
           platform, so left bare they sat off-centre against an avatar. */
        <>
          <span className={`caption-mark ${PROMO_MARK} shrink-0 rounded-full bg-white/[0.06] ring-2 ring-white/10 flex items-center justify-center overflow-hidden`}>
            <FlagImg code={subject.code} size={44} />
          </span>
          <div className={`${COLUMN} caption-text`}>
            <span style={{ fontSize: NAME_SIZE }} className={`${NAME} text-white`}>
              {subject.name}
            </span>
            <span style={{ fontSize: KICKER_SIZE }} className={KICKER}>
              {t.mapWorldThinks}
            </span>
          </div>
        </>
      ) : (
        /* Same row, same slots, same type as the profile state - logo where the
           avatar goes, wordmark where the name goes - so switching between them
           reads as one caption changing subject rather than two components. The
           wordmark is a plain span, NOT a heading: on home the h1 is FilterBar's
           wordmark and a second one here would double it. */
        <>
          <LogoMark className={`caption-mark ${PROMO_MARK} shrink-0`} />
          <div className={`${COLUMN} caption-text`}>
            <span style={{ fontSize: PROMO_NAME_SIZE }} className={`${NAME} text-accent`}>
              {t.appName}
            </span>
            <h2 style={{ fontSize: PROMO_KICKER_SIZE }} className={`${KICKER} leading-normal`}>
              {t.mapGlobalTitle}
            </h2>
          </div>
        </>
      )}
      <span aria-hidden="true" className={SPACER} />
    </div>
  );
}

// A news slide: the HotBanner card's anatomy at the caption's size - picture,
// the news pill with the source and age, the title with its flag and category,
// a line of text. Left-aligned, unlike the centred subject rows: it is
// something to read, not a name to frame. Plain spans, never headings - the
// mark's h2 is home's only content heading.
//
// The picture, the title and the text open the story's page on the news page; a flag
// opens that country's detail, the category chip filters by it, and the source
// name opens the article. Safe to click: hovering the caption pauses its
// rotation, so the slide cannot change between aiming and clicking.
function host(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}

function NewsRow({ news }: { news: NewsItem }) {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleRole } = useFilters();
  const country = getCountryName(news.countryCode, locale);
  const toCountry = () => navigate('/c/' + news.countryCode + location.search);
  const toStory = () => navigate('/n/' + news.id + location.search);
  // On home the chip toggles the filter in place. On a detail (/p, /c, /u) it
  // goes to the filtered home feed instead: toggling there pushed
  // /p/<id>?roles=x as a new history entry, so the detail's close (one step
  // back) landed on the same detail and seemed not to work.
  const filterByRole = () => {
    if (location.pathname === '/') return toggleRole(news.role);
    const params = new URLSearchParams(location.search);
    const roles = (params.get('roles') ?? '').split(',').filter(Boolean);
    if (!roles.includes(news.role)) roles.push(news.role);
    params.set('roles', roles.join(','));
    navigate('/?' + params.toString());
  };
  const onKey = (go: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
  };
  // A flag that opens its country, named on hover - most people cannot read
  // every flag (same as the sidebar card's).
  const flagLink = (flag: ReactNode, className = '') => (
    <HoverTip label={country}>
      <span role="link" tabIndex={0} aria-label={country} onClick={toCountry} onKeyDown={onKey(toCountry)}
        className={`cursor-pointer hover:opacity-80 transition-opacity ${className}`}>
        {flag}
      </span>
    </HoverTip>
  );
  // The flag (only when the picture is a photo - a flag picture already says
  // it) and the category. Both are sized for the sidebar cards by default and
  // read as an afterthought beside this title, so they step up with it.
  const tags = (flag: number) => (
    <>
      {news.person.photoUrl && flagLink(<FlagImg code={news.countryCode} size={flag} />, 'inline-flex')}
      <HoverTip label={`${t.filterBy}: ${t.roles[news.role]}`}>
        <span role="button" tabIndex={0} onClick={filterByRole} onKeyDown={onKey(filterByRole)}
          className="cursor-pointer hover:opacity-80 transition-opacity">
          <RoleBadge role={news.role} className="text-xs! px-2! py-1! @[1100px]:text-sm!" />
        </span>
      </HoverTip>
    </>
  );
  const PICTURE = 'caption-mark w-[64px] h-[64px] @[700px]:w-[80px] @[700px]:h-[80px] @[1100px]:w-[96px] @[1100px]:h-[96px] shrink-0';
  return (
    <div className="flex w-full max-w-[960px] @[1100px]:max-w-[1120px] mx-auto items-center gap-4 @[1100px]:gap-5 pb-2">
      {news.person.photoUrl ? (
        <span role="link" tabIndex={0} aria-label={news.title} onClick={toStory} onKeyDown={onKey(toStory)} className="block shrink-0 cursor-pointer rounded-full transition-transform duration-300 hover:scale-[1.04]">
          <Avatar name={news.person.name} imageUrl={news.person.photoUrl} className={`${PICTURE} ring-2 ring-white/10`} />
        </span>
      ) : (
        flagLink(
          <span className={`${PICTURE} rounded-full bg-white/[0.06] ring-2 ring-white/10 flex items-center justify-center overflow-hidden`}>
            <FlagImg code={news.countryCode} size={40} />
          </span>,
          'block shrink-0',
        )
      )}
      <div className="caption-text min-w-0 flex-1 text-left">
        <div className="flex items-center gap-2 min-w-0 text-xs @[900px]:text-sm">
          <span className="live-pill shrink-0 uppercase font-bold tracking-[0.16em] text-negative-soft bg-accent/15 border border-accent/60 rounded-full px-2 py-0.5">
            <span className="relative inline-flex w-1.5 h-1.5 mr-1.5 align-middle">
              <span className="absolute inset-0 rounded-full bg-accent animate-ping motion-reduce:hidden" />
              <span className="relative w-1.5 h-1.5 rounded-full bg-accent" />
            </span>
            {t.newsLabel}
          </span>
          {/* "Source ✨ · time", as AiSource lays it out: only the name truncates. */}
          <span className="min-w-0 flex items-center gap-1 text-white/50">
            <span className="truncate">
              {/* Same tip as an opinio's SourceLink: "Source: theguardian.com". */}
              <HoverTip label={`${t.sourceLink}: ${host(news.sourceUrl)}`} className="inline">
                <a
                  href={news.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-white underline decoration-white/30 underline-offset-2 hover:decoration-white transition-colors"
                >
                  {news.sourceName}
                </a>
              </HoverTip>
            </span>
            <AiMark className="w-3.5 h-3.5 @[900px]:w-4 @[900px]:h-4" />
            <span className="shrink-0 whitespace-nowrap">· {formatRelativeTime(news.createdAt, locale, t.justNow)}</span>
          </span>
          {/* On the narrow card (1366-1536) the title already takes two lines,
              so the flag and the category ride up here instead of wrapping to
              a third; from 700px they sit after the title, as on every card. */}
          <span className="flex items-center gap-1.5 shrink-0 @[700px]:hidden">{tags(18)}</span>
        </div>
        <div className="mt-1 flex items-center gap-x-1.5 gap-y-0.5 flex-wrap min-w-0">
          <span role="link" tabIndex={0} onClick={toStory} onKeyDown={onKey(toStory)} className="font-semibold text-white leading-snug line-clamp-2 min-w-0 cursor-pointer hover:underline decoration-white/40 underline-offset-4" style={{ fontSize: 'clamp(15px, 2.6cqi, 26px)' }}>
            {news.title}
          </span>
          <span className="hidden @[700px]:flex items-center gap-2 shrink-0">{tags(24)}</span>
        </div>
        <p onClick={toStory} className="text-text-secondary leading-snug mt-0.5 text-sm line-clamp-2 @[900px]:text-base cursor-pointer hover:text-white/80 transition-colors">{news.body}</p>
      </div>
    </div>
  );
}
