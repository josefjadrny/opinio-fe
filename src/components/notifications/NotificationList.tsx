import { Fragment, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { Avatar } from '../profile/Avatar';
import { formatNumber } from '../../utils/formatNumber';
import { formatRelativeTime } from '../../utils/formatRelativeTime';
import { useNotifications, useMarkNotificationsSeen, useClickNotification } from '../../hooks/useNotifications';
import type { Strings } from '../../i18n/strings';
import type { NotificationItem } from '../../types/api';

// Kinds this build can draw. A later phase's kind reaching an older FE is
// skipped rather than drawn as an empty row.
const KNOWN_KINDS = new Set(['milestone']);

// 🌱 1, 🔥 10, ⭐ 50, 💯 100, 🏆 250 and up.
function milestoneIcon(m: number): string {
  return m >= 250 ? '🏆' : m >= 100 ? '💯' : m >= 50 ? '⭐' : m >= 10 ? '🔥' : '🌱';
}

function countriesLabel(t: Strings, locale: string, n: number): string {
  const category = new Intl.PluralRules(locale).select(n);
  const key = category === 'one' ? t.notifCountriesOne : category === 'few' ? t.notifCountriesFew : t.notifCountriesMany;
  return key.replace('{n}', formatNumber(n));
}

// Splices the opinio name into a "{target} ..." template.
function fill(template: string, target: ReactNode, n: string): ReactNode {
  return template.split(/(\{target\}|\{n\})/).map((piece, i) =>
    piece === '{target}' ? <Fragment key={i}>{target}</Fragment>
      : piece === '{n}' ? <Fragment key={i}>{n}</Fragment>
      : <Fragment key={i}>{piece}</Fragment>,
  );
}

// The API stamps microseconds; Date parsing wants at most milliseconds to be
// safe across engines.
const toMs = (iso: string) => iso.replace(/(\.\d{3})\d+Z$/, '$1Z');

function NotificationRow({ item, onClick }: { item: NotificationItem; onClick: () => void }) {
  const { t, locale } = useI18n();
  const m = item.milestone ?? 0;
  const unread = !item.clicked;
  const target = <span className={`font-semibold ${unread ? 'text-white' : 'text-white/80'}`}>{item.profile.name}</span>;
  const meta = [
    item.countries ? countriesLabel(t, locale, item.countries) : null,
    formatRelativeTime(toMs(item.updatedAt), locale, t.justNow),
  ].filter(Boolean).join(' · ');
  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors ${
        unread ? 'bg-white/[0.06] hover:bg-white/[0.1]' : 'hover:bg-white/5'
      }`}
    >
      {/* The opinio's picture with the milestone glyph pinned to it, so the
          row reads "this opinio, this milestone" before the sentence does. */}
      <span className="relative shrink-0">
        <Avatar name={item.profile.name} imageUrl={item.profile.imageUrl} className="w-10 h-10 ring-2 ring-white/5" />
        <span aria-hidden className="absolute -bottom-1 -right-1.5 w-[22px] h-[22px] rounded-full bg-surface border border-white/15 flex items-center justify-center text-[12px] leading-none">
          {milestoneIcon(m)}
        </span>
      </span>
      <span className="flex-1 min-w-0">
        <span className={`block text-sm leading-snug break-words ${unread ? 'text-white/85' : 'text-white/60'}`}>
          {m === 1 ? fill(t.notifMilestoneFirst, target, '1') : fill(t.notifMilestone, target, formatNumber(m))}
        </span>
        <span className="block text-xs text-white/50 mt-0.5">{meta}</span>
      </span>
      {/* Unclicked = highlighted + dot, until this line (or a sibling) is clicked. */}
      <span className={`shrink-0 mt-1.5 w-2 h-2 rounded-full ${unread ? 'bg-accent' : 'bg-transparent'}`} />
    </button>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-start gap-3 px-3 py-2.5 animate-pulse">
      <span className="w-10 h-10 rounded-full bg-white/[0.07] shrink-0" />
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
    return <div className="py-1"><SkeletonRow /><SkeletonRow /><SkeletonRow /></div>;
  }
  if (query.isError) {
    return <p className="text-sm text-white/60 text-center py-8 px-4">{t.notificationsFailed}</p>;
  }
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 px-4">
        <BellIcon className="w-8 h-8 text-white/20" mono />
        <p className="text-sm text-white/60">{t.notificationsEmpty}</p>
      </div>
    );
  }
  return (
    <div className="space-y-0.5">
      {items.map((item) => (
        <NotificationRow
          key={item.id}
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
