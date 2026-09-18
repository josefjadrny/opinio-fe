import { Fragment, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nContext';
import { CountryFlag } from '../common/CountryFlag';
import { CommentIcon } from '../comments/CommentCount';
import { CommentBody } from '../comments/CommentThread';
import { formatRelativeTime } from '../../utils/formatRelativeTime';
import type { UserActivityItem } from '../../types/api';

// The user's timeline, activity-log style: every row is a caption naming
// who did what to which opinio ("@josef commented on Elon Musk"). A comment
// row adds one truncated line of the comment - four rows all reading
// "commented on Elon Musk" are indistinguishable without it; a post row is
// the caption alone, the opinio itself is a click away. The caption is one
// i18n string per kind with {actor}/{target} tokens, so each language
// orders the sentence its own way; the *You variants carry no {actor} at
// all, because "you" declines differently from a handle in half the
// languages. A new kind (likes) is one more icon, two more strings and one
// more branch below.

interface UserActivityListProps {
  items: UserActivityItem[];
  handle: string;
  // Viewer is the user - captions say "You".
  isMe: boolean;
  onOpenProfile: (id: string) => void;
  // Opens the opinio on its thread rather than on the country breakdown.
  onOpenThread: (id: string) => void;
}

// Splices React nodes into a "{actor} did {target}" template.
function fill(template: string, parts: { actor: ReactNode; target: ReactNode }): ReactNode {
  return template.split(/(\{actor\}|\{target\})/).map((piece, i) =>
    piece === '{actor}' ? <Fragment key={i}>{parts.actor}</Fragment>
      : piece === '{target}' ? <Fragment key={i}>{parts.target}</Fragment>
      : <Fragment key={i}>{piece}</Fragment>,
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function ActivityRow({ item, handle, isMe, onOpen, onOpenProfile }: {
  item: UserActivityItem; handle: string; isMe: boolean; onOpen: () => void; onOpenProfile: () => void;
}) {
  const { t, locale } = useI18n();
  const location = useLocation();
  const isComment = item.kind === 'comment';
  const template = isComment
    ? (isMe ? t.activityCommentedYou : t.activityCommented)
    : (isMe ? t.activityPostedYou : t.activityPosted);
  const actor = <span className="font-semibold text-white">@{handle}</span>;
  // The target always opens the opinio itself (its country view) even on a
  // comment row - the row as a whole is what opens the thread.
  const target = (
    <Link
      to={`/p/${item.profile.id}${location.search}`}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpenProfile(); }}
      className="font-semibold text-white hover:underline underline-offset-2"
    >
      {/* The flag is glued to the last word so it never wraps alone. */}
      {item.profile.name}<span className="whitespace-nowrap">&nbsp;<CountryFlag code={item.profile.countryCode} /></span>
    </Link>
  );
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } }}
      className="group flex gap-2.5 md:gap-3 px-2 md:px-2.5 py-2 rounded-xl bg-surface-light/40 ring-1 ring-white/[0.06] hover:ring-white/15 transition-all duration-200 cursor-pointer select-none"
    >
      {/* Kind chip - the one glyph that says post vs comment at a glance. */}
      <span className="shrink-0 mt-0.5 flex items-center justify-center w-7 h-7 rounded-full bg-white/[0.06] ring-1 ring-white/10 text-white/70">
        {isComment ? <CommentIcon className="w-3.5 h-3.5" /> : <PlusIcon className="w-4 h-4" />}
      </span>
      <div className="flex-1 min-w-0">
        {/* Time flows after the caption instead of sitting at the right edge:
            a right-aligned "před 49 minutami" leaves a 390px row no room
            for the sentence. */}
        <p className="text-sm text-white/70 leading-snug">
          {fill(template, { actor, target })}
          <span className="text-xs text-white/50 whitespace-nowrap"> · {formatRelativeTime(item.at, locale, t.justNow)}</span>
        </p>
        {isComment && item.comment && (
          <p className="text-[13px] text-white/60 leading-snug truncate mt-0.5">
            <CommentBody body={item.comment.body} mentions={item.comment.mentions} />
          </p>
        )}
      </div>
    </div>
  );
}

export function UserActivityList({ items, handle, isMe, onOpenProfile, onOpenThread }: UserActivityListProps) {
  const { t } = useI18n();
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-white/60 px-3 pb-2">
        {t.userActivity}
      </p>
      {items.length === 0 ? (
        <p className="text-sm text-white/50 py-4 text-center">{t.userNoActivity}</p>
      ) : (
        <div className="space-y-1">
          {items.map((item) => (
            <ActivityRow
              key={item.comment ? `c-${item.comment.id}` : `p-${item.profile.id}`}
              item={item}
              handle={handle}
              isMe={isMe}
              onOpen={() => (item.kind === 'comment' ? onOpenThread(item.profile.id) : onOpenProfile(item.profile.id))}
              onOpenProfile={() => onOpenProfile(item.profile.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
