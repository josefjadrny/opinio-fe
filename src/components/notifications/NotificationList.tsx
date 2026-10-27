import { Fragment, useEffect, useMemo, useRef, type CSSProperties, type ReactNode } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { Avatar } from '../profile/Avatar';
import { formatRelativeTime } from '../../utils/formatRelativeTime';
import { useNotifications, useMarkNotificationsSeen, useClickNotification } from '../../hooks/useNotifications';
import type { NotificationItem } from '../../types/api';
import { WASH } from '../common/wash';
import { CategoryIcon, StatusPill } from '../support/supportIcons';
import { formatNumber } from '../../utils/formatNumber';
import { CommentIcon } from '../comments/CommentCount';

// Kinds this build can draw. A later phase's kind reaching an older FE is
// skipped rather than drawn as an empty row.
const KNOWN_KINDS = new Set(['milestone', 'comment', 'support']);

// 🌱 1, 🔥 10, ⭐ 50, 💯 100, 🚀 250, 🏆 500, 👑 1000 and up.
function milestoneIcon(m: number): string {
  return m >= 1000 ? '👑' : m >= 500 ? '🏆' : m >= 250 ? '🚀' : m >= 100 ? '💯' : m >= 50 ? '⭐' : m >= 10 ? '🔥' : '🌱';
}

// Splices the opinio name (or ticket title, the acting user, a status) into a
// "{target} ..." template.
function fill(template: string, target: ReactNode, n: ReactNode, extra: Record<string, ReactNode> = {}): ReactNode {
  return template.split(/(\{target\}|\{n\}|\{actors?\}|\{status\})/).map((piece, i) =>
    piece === '{target}' ? <Fragment key={i}>{target}</Fragment>
      : piece === '{n}' ? <Fragment key={i}>{n}</Fragment>
      : piece in extra ? <Fragment key={i}>{extra[piece]}</Fragment>
      : <Fragment key={i}>{piece}</Fragment>,
  );
}

// The API stamps microseconds; Date parsing wants at most milliseconds to be
// safe across engines.
const toMs = (iso: string) => iso.replace(/(\.\d{3})\d+Z$/, '$1Z');

// A ticket update. The ticket's author hears from "Opinio support" (never an
// admin's handle); support's own lines name the user. The status pill is the
// status as of the line's last update - the line stays static.
//
// A close outranks every other event on the line: only the other side's
// actions reach a line, so `done` always means they closed it - even when a
// reply merged into the same unclicked line first (the reply is on the ticket).
function supportSentence(item: NotificationItem, t: ReturnType<typeof useI18n>['t'], target: ReactNode): ReactNode {
  const ticket = item.ticket!;
  const statusLabel = (ticket.isMine ? t.supportStatuses : t.supportStatusesStaff)[ticket.status] ?? ticket.status;
  const status = <span className="font-semibold text-white/90">{statusLabel}</span>;
  if (ticket.isMine) {
    if (ticket.status === 'done') return fill(t.notifSupportClosed, target, null);
    return ticket.event === 'status'
      ? fill(t.notifSupportStatus, target, null, { '{status}': status })
      : fill(t.notifSupportReplied, target, null);
  }
  const actor = <span className="font-semibold text-white/90">@{item.actors[0]?.handle ?? '?'}</span>;
  if (ticket.status === 'done') return fill(t.notifSupportUserClosed, target, null, { '{actor}': actor });
  if (ticket.event === 'created') return fill(t.notifSupportOpened, target, null, { '{actor}': actor });
  if (ticket.event === 'message') return fill(t.notifSupportUserReplied, target, null, { '{actor}': actor });
  return fill(t.notifSupportStatus, target, null, { '{status}': status });
}

// "@a, @b and 3 others commented on your opinio X": up to three names,
// newest first, then the rest as a count. The list joins the language's own way (Intl.ListFormat;
// en-GB for English, no comma before "and"). The verb agrees with one person
// or several.
function commentSentence(item: NotificationItem, t: ReturnType<typeof useI18n>['t'], locale: string, target: ReactNode): ReactNode {
  const names = item.actors.map((a) => (
    <span key={a.id} className="font-semibold text-white/90 whitespace-nowrap">
      @{a.handle}
    </span>
  ));
  if (item.moreCount > 0) {
    const category = new Intl.PluralRules(locale).select(item.moreCount);
    const others = category === 'one' ? t.notifOthersOne : category === 'few' ? t.notifOthersFew : t.notifOthersMany;
    names.push(<Fragment key="more">{others.replace('{n}', formatNumber(item.moreCount))}</Fragment>);
  }
  const parts = new Intl.ListFormat(locale === 'en' ? 'en-GB' : locale, { type: 'conjunction' })
    .formatToParts(names.map((_, i) => String(i)));
  const actors = parts.map((p, i) => (p.type === 'element' ? <Fragment key={i}>{names[Number(p.value)]}</Fragment> : p.value));
  const people = item.actors.length + item.moreCount;
  return fill(people === 1 ? t.notifCommentOne : t.notifCommentMany, target, null, { '{actors}': actors });
}

function NotificationRow({ item, index, onClick }: { item: NotificationItem; index: number; onClick: () => void }) {
  const { t, locale } = useI18n();
  const m = item.milestone ?? 0;
  const unread = !item.clicked;
  const ticket = item.ticket;
  const target = <span className={`font-semibold ${unread ? 'text-white' : 'text-white/80'}`}>{ticket ? ticket.title : item.profile?.name}</span>;
  // The number is the news, so it gets a chip of its own inside the sentence.
  const number = (
    <span className={`inline-block px-1.5 rounded-md font-bold tabular-nums ${unread ? 'bg-white/[0.12] text-white' : 'bg-white/[0.06] text-white/75'}`}>
      {m}
    </span>
  );
  return (
    <button
      onClick={onClick}
      // Rows rise in one after another like the /u/:id activity rows (--i
      // capped so a long page is not left waiting) and lean right on hover.
      style={{ '--i': Math.min(index, 8) } as CSSProperties}
      className={`activity-row-in group relative w-full text-left flex items-start gap-3 px-3 py-3 rounded-xl ring-1 transition-all duration-200 hover:translate-x-0.5 ${
        unread
          ? 'bg-surface-light/80 ring-accent/25 hover:ring-accent/45'
          : 'bg-surface-light/30 ring-white/[0.05] hover:bg-surface-light/60 hover:ring-white/15'
      }`}
    >
      {/* Unclicked lines carry the brand's two sides as an edge bar. */}
      {unread && <span aria-hidden className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-gradient-to-b from-negative to-positive" />}
      <span className="shrink-0 transition-transform duration-200 group-hover:scale-105">
        {ticket ? (
          // A ticket's picture is its category; support's lines carry the
          // user's avatar with the category as a badge.
          ticket.isMine || !item.actors[0] ? (
            <span className="w-11 h-11 rounded-full bg-white/[0.06] ring-2 ring-white/10 flex items-center justify-center">
              <CategoryIcon category={ticket.category} className="w-8 h-8" />
            </span>
          ) : (
            <span className="relative block">
              <Avatar name={item.actors[0].handle} imageUrl={item.actors[0].avatarUrl} className="w-11 h-11 ring-2 ring-white/10" />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-surface ring-1 ring-white/15 flex items-center justify-center">
                <CategoryIcon category={ticket.category} className="w-4 h-4" />
              </span>
            </span>
          )
        ) : (
          <Avatar name={item.profile?.name ?? '?'} imageUrl={item.profile?.imageUrl ?? null} className="w-11 h-11 ring-2 ring-white/10" />
        )}
      </span>
      <span className="flex-1 min-w-0 pr-3">
        <span className={`block text-sm leading-relaxed break-words ${unread ? 'text-white/85' : 'text-white/60'}`}>
          {ticket ? supportSentence(item, t, target) : item.kind === 'comment' ? (
            <>
              {/* The opinio bubble the comments tab wears, in the slot and at the
                  size of a milestone glyph. */}
              <CommentIcon className="inline-block w-[1.35em] h-[1.35em] -mt-1 mr-1 align-middle" />
              {commentSentence(item, t, locale, target)}
            </>
          ) : (
            <>
              {/* The milestone glyph opens the sentence, leaving the picture clear. */}
              <span aria-hidden className="mr-1.5">{milestoneIcon(m)}</span>
              {m === 1 ? fill(t.notifMilestoneFirst, target, '1') : fill(t.notifMilestone, target, number)}
            </>
          )}
        </span>
        <span className="flex items-center gap-2 text-xs text-white/50 mt-1">
          {formatRelativeTime(toMs(item.updatedAt), locale, t.justNow)}
          {ticket && (
            <StatusPill
              status={ticket.status}
              label={(ticket.isMine ? t.supportStatuses : t.supportStatusesStaff)[ticket.status] ?? ticket.status}
            />
          )}
        </span>
      </span>
      {/* Unclicked = tinted ring + a breathing dot, until this line (or a
          sibling) is clicked. */}
      {unread && <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_rgba(233,69,96,0.8)] animate-new-glow" />}
    </button>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-start gap-3 px-3 py-3 rounded-xl bg-surface-light/30 animate-pulse">
      <span className="w-11 h-11 rounded-full bg-white/[0.07] shrink-0" />
      <span className="flex-1 space-y-2 pt-1">
        <span className="block h-3 rounded bg-white/[0.07] w-11/12" />
        <span className="block h-3 rounded bg-white/[0.07] w-1/3" />
      </span>
    </div>
  );
}

export function NotificationList({ onOpenProfile }: { onOpenProfile: (item: NotificationItem) => void }) {
  const { t } = useI18n();
  const query = useNotifications();
  const markSeen = useMarkNotificationsSeen();
  const click = useClickNotification();
  const shownAt = query.data?.pages[0]?.shownAt;

  // Opening the bell marks every line up to the panel's load as seen,
  // scrolled to or not. Once per load (the ref also absorbs StrictMode's
  // double effect).
  const markedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!shownAt || markedFor.current === shownAt) return;
    markedFor.current = shownAt;
    markSeen(shownAt);
  }, [shownAt, markSeen]);

  // A line bumped while the panel is scrolled can come back on a later page.
  const items = useMemo(() => {
    const seenIds = new Set<string>();
    const out: NotificationItem[] = [];
    for (const page of query.data?.pages ?? []) {
      for (const item of page.items) {
        if (seenIds.has(item.id) || !KNOWN_KINDS.has(item.kind)) continue;
        seenIds.add(item.id);
        out.push(item);
      }
    }
    return out;
  }, [query.data]);

  // Infinite scroll: the sentinel under the last row pulls the next page.
  const sentinel = useRef<HTMLDivElement>(null);
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query;
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasNextPage) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isFetchingNextPage) fetchNextPage();
    }, { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, items.length]);

  if (query.isPending) {
    return <div className="space-y-1.5"><SkeletonRow /><SkeletonRow /><SkeletonRow /></div>;
  }
  if (query.isError) {
    return <p className="text-sm text-white/60 text-center py-8 px-4">{t.notificationsFailed}</p>;
  }
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 px-4">
        <span className="user-header-wash w-16 h-16 rounded-full ring-1 ring-white/10 bg-white/[0.04] flex items-center justify-center" style={WASH}>
          <BellIcon className="w-8 h-8" />
        </span>
        <p className="text-sm text-white/60">{t.notificationsEmpty}</p>
      </div>
    );
  }
  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <NotificationRow
          key={item.id}
          index={i}
          item={item}
          onClick={() => { if (shownAt) click(item, shownAt); onOpenProfile(item); }}
        />
      ))}
      {hasNextPage && <div ref={sentinel}>{isFetchingNextPage ? <SkeletonRow /> : <div className="h-4" />}</div>}
    </div>
  );
}

// Built like add-opinio: a red outline shape carrying a green mark - here the
// bell's highlight on its shoulder plus the ball clapper. `mono` draws it in
// currentColor (the empty state).
export function BellIcon({ className = '', mono = false }: { className?: string; mono?: boolean }) {
  const green = mono ? 'currentColor' : 'var(--color-positive)';
  return (
    <svg className={className} fill="none" viewBox="1.75 1.75 20.5 20.5">
      <path
        stroke={mono ? 'currentColor' : 'var(--color-negative)'}
        strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"
        d="M12 4.25c-3.2 0-5.75 2.5-5.75 5.75v2.6c0 1.2-.45 2.35-1.3 3.2l-.45.45c-.45.45-.13 1.25.5 1.25h14c.63 0 .95-.8.5-1.25l-.45-.45a4.5 4.5 0 0 1-1.3-3.2V10c0-3.25-2.55-5.75-5.75-5.75zM12 4.25V2.75"
      />
      <path stroke={green} strokeWidth={2} strokeLinecap="round" d="M9 11.25V10a3 3 0 0 1 2-2.8" />
      <circle cx="12" cy="20.3" r="2.05" fill={green} />
    </svg>
  );
}
