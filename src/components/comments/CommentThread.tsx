import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nContext';
import { useMe } from '../../hooks/useMe';
import { useSignIn } from '../auth/SignInContext';
import { useComments, usePostComment, useDeleteComment, useUserSearch } from '../../hooks/useComments';
import { Avatar } from '../profile/Avatar';
import { TrashIcon } from '../profile/DeleteProfileButton';
import { ConfirmModal } from '../common/ConfirmModal';
import { CountryFlag } from '../common/CountryFlag';
import { EmojiPickerPopover } from '../common/EmojiPickerPopover';
import { HoverTip } from '../common/HoverTip';
import { formatRelativeTime } from '../../utils/formatRelativeTime';
import type { Comment, MentionUser } from '../../types/api';

const MAX_LEN = 280;

// Tallest the composer grows to before it scrolls - about four lines at the
// 13px/snug type. Kept here rather than as a `max-h-*` class because the
// auto-grow below has to know the same number to decide when to hand the box
// back to its own scrollbar.
const MAX_COMPOSER_H = 80;

// Renders the "@handle" tokens the BE lists in `mentions` as links; any other
// "@word" in the body is plain text, so a typo cannot fabricate a mention.
// Also used by the user page's activity list, which has no opinio to come
// back to - hence the optional back state.
export function CommentBody({ body, mentions, backState }: { body: string; mentions: Comment['mentions']; backState?: BackState }) {
  const location = useLocation();
  if (mentions.length === 0) return <>{body}</>;
  const handles = mentions.map((m) => m.handle);
  const idFor = (handle: string) => mentions.find((m) => m.handle === handle)?.userId;
  const re = new RegExp(`(@(?:${handles.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')}))\\b`, 'g');
  return (
    <>
      {body.split(re).map((part, i) =>
        part.startsWith('@') && handles.includes(part.slice(1)) ? (
          <Link
            key={i}
            to={`/u/${idFor(part.slice(1))}${location.search}`}
            state={backState}
            onClick={(e) => e.stopPropagation()}
            className="text-accent font-medium hover:underline underline-offset-2"
          >{part}</Link>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

// Where a user link should come back to: the opinio the thread belongs to.
// Same shape as the "reported by" link in the detail header.
type BackState = { fromProfileId: string; fromProfileName?: string };

// `index` staggers the entrance the way the country rows do (same `stat-in`
// keyframe and 35ms step). Capped so a long thread does not keep the rows
// below the fold waiting on ones nobody has scrolled to yet; a comment
// prepended after a post mounts alone and simply fades in.
function CommentRow({ c, index, profileId, backState }: { c: Comment; index: number; profileId: string; backState: BackState }) {
  const { locale, t } = useI18n();
  const location = useLocation();
  const { data: me } = useMe();
  const remove = useDeleteComment(profileId);
  const [confirmOpen, setConfirmOpen] = useState(false);
  // Own comment, or admin (the BE allows both). Same trash + confirm as the
  // opinio delete in the detail header, sized to the row.
  const canDelete = !!me?.user && (me.user.id === c.user.id || me.user.tier === 'admin');
  const userTo = `/u/${c.user.id}${location.search}`;
  return (
    <div
      className="group flex gap-2.5 py-2.5"
      style={{ animation: 'stat-in 0.25s ease-out both', animationDelay: `${Math.min(index, 12) * 35}ms` }}
    >
      <Link to={userTo} state={backState} className="shrink-0 mt-0.5" aria-label={`@${c.user.handle}`}>
        <Avatar name={c.user.handle} imageUrl={c.user.avatarUrl} className="w-7 h-7" />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-xs leading-none mb-1">
          <Link to={userTo} state={backState} className="font-semibold text-white/90 hover:underline underline-offset-2">@{c.user.handle}</Link>
          {c.user.countryCode && <CountryFlag code={c.user.countryCode} tip={false} />}
          <span className="text-white/50">{formatRelativeTime(c.createdAt, locale, t.justNow)}</span>
          {canDelete && (
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              aria-label={t.deleteComment}
              title={t.deleteComment}
              className="ml-auto -my-1 p-1 text-white/40 hover:text-accent transition-colors"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="text-[13px] text-white/80 leading-snug break-words">
          <CommentBody body={c.body} mentions={c.mentions} backState={backState} />
        </p>
      </div>
      {canDelete && (
        <ConfirmModal
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={() => remove.mutate(c.id, { onSuccess: () => setConfirmOpen(false) })}
          title={t.deleteComment}
          message={t.deleteCommentConfirm}
          confirmLabel={remove.isPending ? t.deleting : t.delete}
          cancelLabel={t.cancel}
          variant="destructive"
          icon={<TrashIcon className="w-5 h-5 text-white/40" />}
          isPending={remove.isPending}
        />
      )}
    </div>
  );
}

// The list only. Height and scrolling are the caller's: the desktop column
// pins it to the description's height, the mobile sheet lets ModalShell
// scroll it.
export function CommentList({ profileId, profileName, className = '' }: { profileId: string; profileName?: string; className?: string }) {
  const { t } = useI18n();
  const backState: BackState = { fromProfileId: profileId, fromProfileName: profileName };
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
      {comments.map((c, i) => <CommentRow key={c.id} c={c} index={i} profileId={profileId} backState={backState} />)}
    </div>
  );
}

// The "@prefix" token the caret is inside of, if any. `start` is the index
// of the "@" so a pick can splice the handle in; the prefix must be at least
// one character, so a bare "@" never asks the API for the whole user list.
function mentionAtCaret(text: string, caret: number): { start: number; query: string } | null {
  const m = text.slice(0, caret).match(/(^|[^a-z0-9_])@([a-z0-9_]{1,30})$/i);
  if (!m) return null;
  return { start: caret - m[2].length - 1, query: m[2].toLowerCase() };
}

// Keystrokes arrive faster than the search is worth asking; the last value
// wins after a short pause.
function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

// Single-line composer: a comment is one paragraph, so Enter sends and a
// pasted line break becomes a space (the BE collapses whitespace anyway).
// Registered and above only - anonymous visitors get a sign-in line instead
// of a disabled box, so the thread never dangles a control that does nothing.
export function CommentComposer({ profileId, compact = false }: { profileId: string; compact?: boolean }) {
  const { t } = useI18n();
  const { data: me } = useMe();
  const { promptSignIn } = useSignIn();
  const [value, setValue] = useState('');
  const [mention, setMention] = useState<{ start: number; query: string } | null>(null);
  const [active, setActive] = useState(0);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiWrapRef = useRef<HTMLDivElement>(null);
  // Caret to restore after a pick splices the handle in - React re-renders the
  // textarea with the new value before the caret can be placed.
  const pendingCaret = useRef<number | null>(null);
  const post = usePostComment(profileId);
  const isRegistered = !!me?.user && me.user.tier !== 'anonymous';

  const query = useDebounced(mention?.query ?? '', 150);
  const { data: search } = useUserSearch(query);
  const suggestions: MentionUser[] = mention && query ? (search?.users ?? []) : [];
  const popoverOpen = suggestions.length > 0;

  useEffect(() => {
    if (pendingCaret.current === null) return;
    const ta = textareaRef.current;
    if (ta) { ta.focus(); ta.setSelectionRange(pendingCaret.current, pendingCaret.current); }
    pendingCaret.current = null;
  }, [value]);

  // A `rows={1}` box does not grow, so the moment the text wrapped to a second
  // line the first one scrolled out of sight behind a scrollbar in a one-line
  // window. Grow to fit instead, and only hand the box its own scrollbar once
  // it hits the cap. Layout effect so the height is set in the same frame as
  // the character that caused the wrap - in a plain effect the box visibly
  // jumps a frame later.
  useLayoutEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    const full = ta.scrollHeight;
    ta.style.height = `${Math.min(full, MAX_COMPOSER_H)}px`;
    ta.style.overflowY = full > MAX_COMPOSER_H ? 'auto' : 'hidden';
  }, [value, isRegistered]);

  // Close the emoji popover on an outside click or Escape. Escape is handled in
  // the capture phase so it dismisses the picker without also bubbling up to
  // ModalShell's Escape-to-close (otherwise one keypress would shut both the
  // picker and the thread sheet).
  useEffect(() => {
    if (!emojiOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!emojiWrapRef.current?.contains(e.target as Node)) setEmojiOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); setEmojiOpen(false); }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [emojiOpen]);

  if (!isRegistered) {
    return (
      <div className={`text-xs text-white/50 ${compact ? 'py-2' : 'py-3'}`}>
        <button type="button" onClick={promptSignIn} className="text-accent hover:underline underline-offset-2">{t.commentsSignIn}</button>
      </div>
    );
  }

  const syncMention = (text: string, caret: number) => {
    const next = mentionAtCaret(text, caret);
    setMention(next);
    if (next?.query !== mention?.query) setActive(0);
  };

  const pick = (u: MentionUser) => {
    if (!mention) return;
    const ta = textareaRef.current;
    const caret = ta?.selectionStart ?? value.length;
    const head = `${value.slice(0, mention.start)}@${u.handle} `;
    const next = (head + value.slice(caret)).slice(0, MAX_LEN);
    pendingCaret.current = Math.min(head.length, next.length);
    setValue(next);
    setMention(null);
  };

  // Insert at the caret (or over the selection), same as the opinio body's
  // picker: counted in the UTF-16 units the counter and the BE use, and dropped
  // whole rather than truncated mid-glyph if it would not fit.
  const insertEmoji = (emoji: string) => {
    const ta = textareaRef.current;
    const start = ta?.selectionStart ?? value.length;
    const end = ta?.selectionEnd ?? value.length;
    const next = value.slice(0, start) + emoji + value.slice(end);
    if (next.length > MAX_LEN) return;
    pendingCaret.current = start + emoji.length;
    setValue(next);
    setMention(null);
  };

  const submit = () => {
    const body = value.trim();
    if (!body || post.isPending) return;
    post.mutate(body, { onSuccess: () => setValue('') });
  };

  // The text stays in the box on failure so nothing is lost; the line under
  // it says why, and the next keystroke clears it.
  const errorStatus = (post.error as { status?: number } | null)?.status;
  const errorText = !post.isError ? null
    : errorStatus === 429 ? t.commentsTooMany
    : errorStatus === 409 ? t.commentsDuplicate
    : t.commentsFailed;

  return (
    <div>
    <div className="flex items-center gap-2">
      <Avatar name={me.user.displayName} imageUrl={me.user.avatarUrl ?? null} className="w-7 h-7 shrink-0" />
      <div ref={emojiWrapRef} className="flex-1 min-w-0 relative">
        {/* Mention picker. Opens upward - the desktop column has the
            description above, the mobile sheet its thread - and the list
            is the API's answer, so an unknown handle simply shows nothing. */}
        {popoverOpen && (
          <ul
            role="listbox"
            className="absolute bottom-full left-0 mb-1 w-full max-h-48 overflow-y-auto rounded-lg bg-surface ring-1 ring-white/15 shadow-2xl py-1 z-20"
          >
            {suggestions.map((u, i) => (
              <li key={u.id} role="option" aria-selected={i === active}>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); pick(u); }}
                  onMouseEnter={() => setActive(i)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-left text-[13px] ${i === active ? 'bg-white/[0.08] text-white' : 'text-white/80'}`}
                >
                  <Avatar name={u.handle} imageUrl={u.avatarUrl} className="w-6 h-6 shrink-0" />
                  <span className="font-medium truncate">@{u.handle}</span>
                  {u.countryCode && <CountryFlag code={u.countryCode} tip={false} />}
                </button>
              </li>
            ))}
          </ul>
        )}
        {/* The narrow sheet gets the short placeholder - the @ hint wraps to
            a second line there and collides with the counter, which only
            appears once there is something to count. */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            const next = e.target.value.replace(/[\r\n]+/g, ' ').slice(0, MAX_LEN);
            setValue(next);
            if (post.isError) post.reset();
            syncMention(next, Math.min(e.target.selectionStart ?? next.length, next.length));
          }}
          onSelect={(e) => syncMention(value, e.currentTarget.selectionStart ?? value.length)}
          onBlur={() => setMention(null)}
          onKeyDown={(e) => {
            if (popoverOpen) {
              if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (a + 1) % suggestions.length); return; }
              if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (a - 1 + suggestions.length) % suggestions.length); return; }
              if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); pick(suggestions[active]); return; }
              if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setMention(null); return; }
            }
            if (e.key === 'Enter') { e.preventDefault(); submit(); }
          }}
          rows={1}
          placeholder={compact ? t.commentsWrite : t.commentsPlaceholder}
          // `block`: an inline textarea leaves a descender strip under itself,
          // which made its wrapper 7px taller than the box - the avatar and the
          // stretched button centred on the wrapper, the input sat high.
          // The right padding clears the emoji button, plus the counter once
          // there is something to count; height/overflow are the auto-grow's.
          className={`block w-full resize-none rounded-lg bg-white/[0.04] ring-1 ring-white/10 focus:ring-accent/60 focus:outline-none px-3 py-2 text-[13px] text-white placeholder:text-white/50 leading-snug ${value ? 'pr-16' : 'pr-9'}`}
          style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
        />
        {value.length > 0 && (
          <span className="absolute right-9 bottom-2.5 text-[10px] tabular-nums text-white/50">{MAX_LEN - value.length}</span>
        )}
        {/* Same picker as the opinio body, bottom-pinned so it stays put as the
            box grows. It opens upward - the thread is above the composer in
            both the desktop column and the mobile sheet. */}
        <HoverTip label={t.emojiAdd} className="contents">
        <button
          type="button"
          onClick={() => setEmojiOpen((v) => !v)}
          aria-label={t.emojiAdd}
          className={`absolute bottom-1 right-1 flex items-center justify-center w-7 h-7 rounded-md text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors ${emojiOpen ? 'bg-white/5 text-white/80' : ''}`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
          </svg>
        </button>
        </HoverTip>
        {emojiOpen && (
          <div className="absolute bottom-full right-0 mb-2 z-30">
            <EmojiPickerPopover onPick={insertEmoji} />
          </div>
        )}
      </div>
      {/* Bottom-aligned, not stretched: the box grows now, and a Send button
          that grew with it turned into a four-line slab. The explicit leading
          makes it exactly as tall as the one-line composer it sits beside. */}
      <button
        type="button"
        onClick={submit}
        disabled={value.trim().length === 0 || post.isPending}
        className="shrink-0 self-end rounded-lg px-3 py-2 text-xs leading-[18px] font-semibold bg-accent text-white disabled:bg-white/[0.06] disabled:text-white/30 transition-colors"
      >
        {t.commentsSend}
      </button>
    </div>
    {errorText && (
      <p role="alert" className="mt-1.5 text-xs text-negative-soft">{errorText}</p>
    )}
    </div>
  );
}
