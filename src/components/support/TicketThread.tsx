import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nContext';
import { useMe } from '../../hooks/useMe';
import { Avatar } from '../profile/Avatar';
import { FlagImg } from '../common/CountryFlag';
import { HoverTip } from '../common/HoverTip';
import { LogoMark } from '../common/LogoMark';
import { CommentBody } from '../comments/CommentThread';
import { formatRelativeTime } from '../../utils/formatRelativeTime';
import {
  useSupportTicket, usePostSupportMessage, useUpdateStatus, useUpdateNote, useMarkTicketRead,
} from '../../hooks/useSupport';
import { CategoryIcon, StatusPill, ProgressBar } from './supportIcons';
import { formatDateTime, isViewerTurn, useStatusLabel, PROGRESS } from './support';
import type { SupportMessage, SupportTicketDetail, SupportTicketStatus } from '../../types/api';

const MAX_LEN = 5000;
const MAX_COMPOSER_H = 160;
const STATUSES: SupportTicketStatus[] = ['new', 'investigating', 'waiting', 'done'];

function BackButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className="group flex items-center gap-1.5 text-xs md:text-[13px] min-[2200px]:text-sm font-medium text-white/50 hover:text-white/80 transition-colors">
      <svg className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      {label}
    </button>
  );
}

function Progress({ status, staff }: { status: SupportTicketStatus; staff: boolean }) {
  const { t } = useI18n();
  const label = useStatusLabel(staff);
  const middle: SupportTicketStatus = status === 'waiting' ? 'waiting' : 'investigating';
  const stops: SupportTicketStatus[] = ['new', middle, 'done'];
  const reached = (s: SupportTicketStatus) => PROGRESS[status] >= PROGRESS[s] - (s === 'waiting' ? 18 : 0);

  return (
    <div className="rounded-xl bg-white/[0.035] ring-1 ring-inset ring-white/10 px-3.5 pt-3 pb-2.5">
      <ProgressBar status={status} className="h-1.5" />
      <div className="mt-2 grid grid-cols-3 text-xs md:text-[13px] min-[2200px]:text-sm font-medium">
        {stops.map((s, i) => (
          <span
            key={s}
            className={`${i === 0 ? 'text-left' : i === 1 ? 'text-center' : 'text-right'} transition-colors duration-500 ${
              s === status ? 'text-white' : reached(s) ? 'text-white/60' : 'text-white/50'
            }`}
          >
            {label(s)}
          </span>
        ))}
      </div>
      {!staff && <p className="mt-2 text-[13px] md:text-sm min-[2200px]:text-[15px] text-white/70 leading-snug">{t.supportStatusHints[status]}</p>}
    </div>
  );
}

type Entry = SupportMessage & { authorName: string; avatarUrl: string | null; first?: boolean };

function Bubble({ m, mine, staffView, fresh, index }: { m: Entry; mine: boolean; staffView: boolean; fresh: boolean; index: number }) {
  const { t, locale } = useI18n();
  // Support speaks as Opinio: the logo, never an admin's picture. Support's
  // own view adds which admin wrote it.
  const avatar = m.fromStaff ? (
    <span className="w-7 h-7 rounded-full bg-surface-light ring-1 ring-white/15 flex items-center justify-center shrink-0">
      <LogoMark className="w-[18px] h-[18px]" />
    </span>
  ) : (
    <Avatar name={m.authorName} imageUrl={m.avatarUrl} className="w-7 h-7 shrink-0" />
  );
  const who = m.fromStaff ? t.supportFromSupport : mine ? t.supportYou : `@${m.authorName}`;
  return (
    <div
      className={`flex gap-2 items-end ${mine ? 'flex-row-reverse' : ''} ${fresh ? 'comment-arrive' : ''}`}
      style={fresh ? undefined : { animation: 'stat-in 0.25s ease-out both', animationDelay: `${Math.min(index, 10) * 35}ms` } as CSSProperties}
    >
      {avatar}
      <div className={`relative min-w-0 max-w-[85%] flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
        <div className={`flex items-center gap-1.5 text-xs md:text-[13px] min-[2200px]:text-sm leading-none mb-1 px-1 ${mine ? 'flex-row-reverse' : ''}`}>
          <span className={`font-semibold ${m.fromStaff ? 'text-white' : 'text-white/80'}`}>{who}</span>
          {staffView && m.fromStaff && m.staffHandle && <span className="text-white/50">@{m.staffHandle}</span>}
          <HoverTip label={formatDateTime(m.createdAt)}>
            <span className="text-white/50">{formatRelativeTime(m.createdAt, locale, t.justNow)}</span>
          </HoverTip>
        </div>
        <div
          className={`relative rounded-2xl px-3.5 py-2.5 ring-1 ring-inset text-sm md:text-[15px] min-[2200px]:text-base leading-relaxed whitespace-pre-wrap break-words ${
            mine
              ? 'rounded-br-md bg-accent/[0.13] ring-accent/30 text-white/90'
              : m.fromStaff
                ? 'rounded-bl-md bg-positive/[0.07] ring-positive/25 text-white/85'
                : 'rounded-bl-md bg-white/[0.045] ring-white/10 text-white/85'
          }`}
        >
          {fresh && <span aria-hidden className="comment-flash absolute inset-0 rounded-2xl ring-1 ring-inset ring-accent bg-accent/[0.07]" />}
          <CommentBody body={m.body} mentions={[]} />
        </div>
      </div>
    </div>
  );
}

function AdminTools({ ticket }: { ticket: SupportTicketDetail }) {
  const { t } = useI18n();
  const label = useStatusLabel(true);
  const status = useUpdateStatus();
  const note = useUpdateNote();
  const [noteOpen, setNoteOpen] = useState(!!ticket.adminNote);
  const [draft, setDraft] = useState(ticket.adminNote ?? '');
  const [saved, setSaved] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1.5 flex-wrap">
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            disabled={status.isPending}
            onClick={() => s !== ticket.status && status.mutate({ id: ticket.id, status: s })}
            aria-pressed={ticket.status === s}
            className={`rounded-full transition-all duration-200 disabled:opacity-60 ${ticket.status === s ? 'scale-105' : 'opacity-60 hover:opacity-100 grayscale-[0.6] hover:grayscale-0'}`}
          >
            <StatusPill status={s} label={label(s)} />
          </button>
        ))}
      </div>
      <div className="rounded-xl ring-1 ring-inset ring-amber-400/20 bg-amber-500/[0.04]">
        <button
          type="button"
          onClick={() => setNoteOpen((v) => !v)}
          className="w-full flex items-center justify-between px-3 py-2 text-[13px] md:text-sm min-[2200px]:text-[15px] font-semibold text-amber-300/90"
          aria-expanded={noteOpen}
        >
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            {t.supportAdminNote}
            {ticket.adminNote && !noteOpen && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
          </span>
          <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${noteOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${noteOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
          <div className="min-h-0 overflow-hidden">
            <div className="px-3 pb-3">
              <textarea
                value={draft}
                onChange={(e) => { setDraft(e.target.value); setSaved(false); }}
                rows={3}
                maxLength={MAX_LEN}
                className="block w-full resize-none rounded-lg bg-white/[0.04] ring-1 ring-white/10 focus:ring-amber-400/50 focus:outline-none px-3 py-2 text-sm md:text-[15px] min-[2200px]:text-base text-white placeholder:text-white/50"
                style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
              />
              <div className="flex items-center justify-end gap-2 mt-1.5">
                {saved && <span className="text-xs text-positive">✓</span>}
                <button
                  type="button"
                  disabled={note.isPending || draft === (ticket.adminNote ?? '')}
                  onClick={() => note.mutate({ id: ticket.id, adminNote: draft }, { onSuccess: () => setSaved(true) })}
                  className="text-xs md:text-[13px] min-[2200px]:text-sm font-semibold px-3 py-1 rounded-lg bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-400/30 hover:bg-amber-500/25 disabled:opacity-40 transition-colors"
                >
                  {t.supportSave}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TicketThread({ ticketId, onBack }: { ticketId: string; onBack: () => void }) {
  const { t, locale } = useI18n();
  const location = useLocation();
  const { data: me } = useMe();
  const { data: ticket, isPending, isError } = useSupportTicket(ticketId);
  const close = useUpdateStatus();
  const markRead = useMarkTicketRead();
  const endRef = useRef<HTMLDivElement>(null);
  const isAdmin = me?.user?.tier === 'admin';
  // Support's view of someone else's ticket; an admin's own ticket reads as a user's.
  const staff = isAdmin && !!ticket && ticket.userId !== me?.user?.id;

  // Messages there when the thread first rendered come in with the list's
  // stagger; anything after (a poll, a send) rises in with the accent flash.
  const [known, setKnown] = useState<Set<string> | null>(null);
  if (ticket && known === null) setKnown(new Set(ticket.messages.map((m) => m.id)));
  const messageCount = ticket?.messages.length ?? 0;
  const lastFromOther = ticket?.messages.at(-1)?.fromStaff === !staff;

  // Opened = read: clears this ticket's bell line, and again whenever the
  // other side's message arrives while it is open.
  useEffect(() => {
    markRead(ticketId);
  }, [ticketId, markRead]);
  useEffect(() => {
    if (known && lastFromOther) markRead(ticketId);
    // Only a new message should re-run it, not the first load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageCount, lastFromOther, ticketId, markRead]);

  // Land on the newest message, and follow the thread as it grows - only
  // then: a poll that brings nothing new must not yank a reader scrolled up.
  const loaded = !!ticket;
  useLayoutEffect(() => {
    if (!loaded) return;
    endRef.current?.scrollIntoView({ block: 'end', behavior: messageCount > (known?.size ?? 0) ? 'smooth' : 'auto' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, messageCount]);

  if (isPending) {
    return (
      <div className="px-6 py-5 space-y-3 animate-pulse">
        <div className="h-4 w-1/3 rounded bg-white/[0.07]" />
        <div className="h-16 rounded-xl bg-white/[0.05]" />
        <div className="h-20 w-4/5 rounded-2xl bg-white/[0.05]" />
      </div>
    );
  }
  if (isError || !ticket) {
    return (
      <div className="px-6 py-5 flex flex-col gap-4">
        <BackButton onClick={onBack} label={t.supportBack} />
        <p className="text-sm md:text-[15px] min-[2200px]:text-base text-white/60 text-center py-8">{t.supportLoadFailed}</p>
      </div>
    );
  }

  const label = statusLabelFor(staff, t);
  const author = staff ? (ticket.userDisplayName ?? '?') : (me?.user?.displayName ?? '');
  const authorAvatar = staff ? (ticket.userAvatarUrl ?? null) : (me?.user?.avatarUrl ?? null);
  const entries: Entry[] = [
    { id: `ticket-${ticket.id}`, body: ticket.description, fromStaff: false, createdAt: ticket.createdAt, authorName: author, avatarUrl: authorAvatar, first: true },
    ...ticket.messages.map((m) => ({ ...m, authorName: author, avatarUrl: authorAvatar })),
  ];

  return (
    <div className="px-5 sm:px-6 py-4 flex flex-col gap-4 support-view-in">
      <div className="flex items-center justify-between gap-2">
        <BackButton onClick={onBack} label={t.supportBack} />
        <div className="flex items-center gap-2">
          {!staff && ticket.status !== 'done' && (
            <button
              type="button"
              disabled={close.isPending}
              onClick={() => close.mutate({ id: ticket.id, status: 'done' })}
              className="group flex items-center gap-1 rounded-full px-2.5 py-1 text-xs min-[2200px]:text-[13px] font-semibold text-white/60 ring-1 ring-inset ring-white/10 hover:text-positive hover:ring-positive/40 hover:bg-positive/10 disabled:opacity-50 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {t.supportClose}
            </button>
          )}
          <StatusPill key={ticket.status} status={ticket.status} label={label(ticket.status)} pulse={isViewerTurn(ticket.status, staff)} className="caption-pill-enter" />
        </div>
      </div>

      <div className="flex items-start gap-3">
        <span className="user-header-wash w-11 h-11 rounded-full ring-1 ring-white/15 bg-white/[0.05] flex items-center justify-center shrink-0" style={{ '--wash-a': 'rgba(239,68,68,0.18)', '--wash-b': 'rgba(34,197,94,0.16)' } as CSSProperties}>
          <CategoryIcon category={ticket.category} className="w-8 h-8" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base md:text-lg min-[2200px]:text-xl font-semibold text-white leading-snug break-words">{ticket.title}</h2>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap text-xs md:text-[13px] min-[2200px]:text-sm text-white/50">
            <span>{t.supportCategories[ticket.category]}</span>
            <span className="text-white/20">·</span>
            <HoverTip label={formatDateTime(ticket.createdAt)}>
              <span>{formatRelativeTime(ticket.createdAt, locale, t.justNow)}</span>
            </HoverTip>
            {staff && (
              <>
                <span className="text-white/20">·</span>
                <Link to={`/u/${ticket.userId}${location.search}`} className="flex items-center gap-1.5 hover:text-white/80 transition-colors">
                  <Avatar name={ticket.userDisplayName ?? '?'} imageUrl={ticket.userAvatarUrl ?? null} className="w-4 h-4" />
                  <span>@{ticket.userDisplayName}</span>
                </Link>
                {ticket.userCountryCode && <FlagImg code={ticket.userCountryCode} className="inline-block align-middle shrink-0" />}
                {ticket.userTier && ticket.userTier !== 'registered' && <span className="text-red-400">{ticket.userTier}</span>}
              </>
            )}
          </div>
        </div>
      </div>

      <Progress status={ticket.status} staff={staff} />
      {staff && <AdminTools key={ticket.id} ticket={ticket} />}

      <div className="flex flex-col gap-3.5 pt-1">
        {entries.map((m, i) => (
          <Bubble
            key={m.id}
            m={m}
            index={i}
            mine={staff ? m.fromStaff : !m.fromStaff}
            staffView={staff}
            fresh={!!known && !m.first && !known.has(m.id)}
          />
        ))}
      </div>
      <div ref={endRef} />
    </div>
  );
}

// The same as useStatusLabel as a plain function, for use after the early
// returns in TicketThread.
function statusLabelFor(staff: boolean, t: ReturnType<typeof useI18n>['t']) {
  return (s: SupportTicketStatus) => (staff ? t.supportStatusesStaff : t.supportStatuses)[s] ?? s;
}

// The reply box, pinned under the thread in the window's footer. Enter is a
// new line (tickets keep their paragraphs); Ctrl/Cmd+Enter or the button sends.
export function TicketComposer({ ticketId }: { ticketId: string }) {
  const { t } = useI18n();
  const { data: me } = useMe();
  const { data: ticket } = useSupportTicket(ticketId);
  const post = usePostSupportMessage(ticketId);
  const [value, setValue] = useState('');
  const [sent, setSent] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  const staff = me?.user?.tier === 'admin' && !!ticket && ticket.userId !== me?.user?.id;

  // Auto-grow up to MAX_COMPOSER_H, then its own scrollbar.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_COMPOSER_H)}px`;
    el.style.overflowY = el.scrollHeight > MAX_COMPOSER_H ? 'auto' : 'hidden';
  }, [value]);

  useEffect(() => {
    if (!sent) return;
    const id = window.setTimeout(() => setSent(false), 900);
    return () => window.clearTimeout(id);
  }, [sent]);

  if (!ticket || !me?.user) return null;

  const submit = () => {
    const body = value.trim();
    if (!body || post.isPending) return;
    post.mutate(body, {
      onSuccess: () => { setValue(''); setSent(true); },
    });
  };

  const errorStatus = (post.error as { status?: number } | null)?.status;
  const errorText = !post.isError ? null : errorStatus === 429 ? t.supportTooMany : t.supportSendFailed;
  const reopen = !staff && ticket.status === 'done';

  return (
    <div>
      <div className="flex items-end gap-2">
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => { setValue(e.target.value.slice(0, MAX_LEN)); if (post.isError) post.reset(); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); submit(); }
          }}
          rows={1}
          placeholder={reopen ? t.supportReopenPlaceholder : t.supportReplyPlaceholder}
          className="block flex-1 min-w-0 resize-none rounded-xl bg-white/[0.04] ring-1 ring-white/10 focus:ring-accent/60 focus:outline-none px-3.5 py-2.5 text-sm md:text-[15px] min-[2200px]:text-base text-white placeholder:text-white/50 leading-snug transition-shadow"
          style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
        />
        <button
          type="button"
          onClick={submit}
          disabled={value.trim().length === 0 && !post.isPending && !sent}
          aria-busy={post.isPending}
          aria-label={t.supportSend}
          className="relative shrink-0 rounded-xl px-3.5 py-2.5 text-[13px] md:text-sm min-[2200px]:text-[15px] leading-[19px] font-semibold bg-accent text-white disabled:bg-white/[0.06] disabled:text-white/30 transition-colors active:scale-95 motion-reduce:active:scale-100"
        >
          <span className={`flex items-center gap-1.5 ${post.isPending || sent ? 'invisible' : ''}`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.27 3.13A59.8 59.8 0 0121.49 12 59.8 59.8 0 013.27 20.88L6 12zm0 0h7.5" />
            </svg>
            <span className="hidden sm:inline">{t.supportSend}</span>
          </span>
          {(post.isPending || sent) && (
            <span className="absolute inset-0 flex items-center justify-center" aria-hidden>
              {post.isPending ? (
                <svg className="w-4 h-4 animate-spin motion-reduce:animate-none" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
                  <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              ) : (
                <svg className="send-check w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </span>
          )}
        </button>
      </div>
      <div className="flex items-center justify-between mt-1.5 min-h-4">
        {errorText ? <p role="alert" className="text-xs md:text-[13px] min-[2200px]:text-sm text-negative-soft">{errorText}</p> : <span />}
        <span className="hidden md:inline text-xs min-[2200px]:text-[13px] text-white/50">
          {value.length > MAX_LEN - 500 ? `${MAX_LEN - value.length} · ` : ''}{t.supportSendHint}
        </span>
      </div>
    </div>
  );
}
