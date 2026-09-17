import { Fragment, useState } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { useMe } from '../../hooks/useMe';
import { useComments, usePostComment } from '../../hooks/useComments';
import { Avatar } from '../profile/Avatar';
import { CountryFlag } from '../common/CountryFlag';
import { formatRelativeTime } from '../../utils/formatRelativeTime';
import type { Comment } from '../../types/api';

const MAX_LEN = 280;

// Renders the "@handle" tokens the BE lists in `mentions` as links; any other
// "@word" in the body is plain text, so a typo cannot fabricate a mention.
function CommentBody({ body, mentions }: { body: string; mentions: Comment['mentions'] }) {
  if (mentions.length === 0) return <>{body}</>;
  const handles = mentions.map((m) => m.handle);
  const re = new RegExp(`(@(?:${handles.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')}))\\b`, 'g');
  return (
    <>
      {body.split(re).map((part, i) =>
        part.startsWith('@') && handles.includes(part.slice(1)) ? (
          <span key={i} className="text-accent font-medium hover:underline underline-offset-2 cursor-pointer">{part}</span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

function CommentRow({ c }: { c: Comment }) {
  const { locale, t } = useI18n();
  return (
    <div className="flex gap-2.5 py-2.5">
      <Avatar name={c.user.handle} imageUrl={c.user.avatarUrl} className="w-7 h-7 shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-xs leading-none mb-1">
          <span className="font-semibold text-white/90">@{c.user.handle}</span>
          {c.user.countryCode && <CountryFlag code={c.user.countryCode} tip={false} />}
          <span className="text-white/50">{formatRelativeTime(c.createdAt, locale, t.justNow)}</span>
        </div>
        <p className="text-[13px] text-white/80 leading-snug break-words">
          <CommentBody body={c.body} mentions={c.mentions} />
        </p>
      </div>
    </div>
  );
}

// The list only. Height and scrolling are the caller's: the desktop column
// pins it to the description's height, the mobile sheet lets ModalShell
// scroll it.
export function CommentList({ profileId, className = '' }: { profileId: string; className?: string }) {
  const { t } = useI18n();
  const { data, isLoading } = useComments(profileId, true);
  if (isLoading) {
    return <p className={`text-xs text-white/50 py-3 ${className}`}>{t.loading}</p>;
  }
  const comments = data?.comments ?? [];
  if (comments.length === 0) {
    return <p className={`text-xs text-white/50 py-3 ${className}`}>{t.commentsEmpty}</p>;
  }
  return (
    <div className={`divide-y divide-white/[0.06] ${className}`}>
      {comments.map((c) => <CommentRow key={c.id} c={c} />)}
    </div>
  );
}

// One-line composer that grows to three. Registered and above only - anonymous
// visitors get a sign-in line instead of a disabled box, so the thread never
// dangles a control that does nothing.
export function CommentComposer({ profileId, compact = false }: { profileId: string; compact?: boolean }) {
  const { t } = useI18n();
  const { data: me } = useMe();
  const [value, setValue] = useState('');
  const post = usePostComment(profileId);
  const isRegistered = !!me?.user && me.user.tier !== 'anonymous';

  if (!isRegistered) {
    return (
      <div className={`text-xs text-white/50 ${compact ? 'py-2' : 'py-3'}`}>
        <button type="button" className="text-accent hover:underline underline-offset-2">{t.commentsSignIn}</button>
      </div>
    );
  }

  const submit = () => {
    const body = value.trim();
    if (!body || post.isPending) return;
    post.mutate(body, { onSuccess: () => setValue('') });
  };

  return (
    <div className="flex items-center gap-2">
      <Avatar name={me.user.displayName} imageUrl={me.user.avatarUrl ?? null} className="w-7 h-7 shrink-0" />
      <div className="flex-1 min-w-0 relative">
        {/* The narrow sheet gets the short placeholder - the @ hint wraps to
            a second line there and collides with the counter, which only
            appears once there is something to count. */}
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value.slice(0, MAX_LEN))}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
          }}
          rows={1}
          placeholder={compact ? t.commentsWrite : t.commentsPlaceholder}
          className={`w-full resize-none rounded-lg bg-white/[0.04] ring-1 ring-white/10 focus:ring-accent/60 focus:outline-none px-3 py-2 text-[13px] text-white placeholder:text-white/40 leading-snug max-h-20 ${value ? 'pr-12' : 'overflow-hidden'}`}
          style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
        />
        {value.length > 0 && (
          <span className="absolute right-2.5 bottom-2.5 text-[10px] tabular-nums text-white/40">{MAX_LEN - value.length}</span>
        )}
      </div>
      <button
        type="button"
        onClick={submit}
        disabled={value.trim().length === 0 || post.isPending}
        className="shrink-0 self-stretch rounded-lg px-3 text-xs font-semibold bg-accent text-white disabled:bg-white/[0.06] disabled:text-white/30 transition-colors"
      >
        {t.commentsSend}
      </button>
    </div>
  );
}
