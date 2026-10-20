import { useState, type CSSProperties } from 'react';
import { useLocation } from 'react-router-dom';
import { ModalShell } from '../common/ModalShell';
import { useI18n } from '../../i18n/I18nContext';
import { useMe } from '../../hooks/useMe';
import { ActionChip } from '../common/ActionChip';
import { useSignIn } from '../auth/SignInContext';
import { SignInIcon } from '../auth/SignInIcon';
import { Avatar } from '../profile/Avatar';
import { FlagImg } from '../common/CountryFlag';
import { HoverTip } from '../common/HoverTip';
import { WASH } from '../common/wash';
import { formatRelativeTime } from '../../utils/formatRelativeTime';
import { useSupportTickets, useCreateTicket } from '../../hooks/useSupport';
import { useReports } from '../../hooks/useReports';
import { ReportsList } from './ReportsList';
import { TicketThread, TicketComposer } from './TicketThread';
import { isViewerTurn, useStatusLabel, formatDateTime } from './support';
import { SupportIcon, CategoryIcon, StatusPill, ProgressBar } from './supportIcons';
import type { SupportTicket, SupportTicketCategory } from '../../types/api';

interface SupportModalProps {
  onClose: () => void;
}

const CATEGORIES: SupportTicketCategory[] = ['bug', 'feature', 'subscription', 'account', 'other'];

function PlusIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function BubbleCountIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.5c0 1.6 1.12 2.99 2.7 3.22 1.09.16 2.19.28 3.3.37V21l4.18-4.18a1.15 1.15 0 01.8-.33 48.3 48.3 0 005.58-.47c1.58-.23 2.7-1.62 2.7-3.22V6.74c0-1.6-1.12-2.99-2.7-3.22A48.4 48.4 0 0012 3c-2.39 0-4.74.17-7.04.5-1.58.24-2.7 1.63-2.7 3.23v6.02z" />
    </svg>
  );
}

// One ticket in the list - the notification row's card: an unread ticket
// (an unclicked bell line) gets the tinted ring, the red-green edge bar and
// the breathing dot; rows rise in one after another and lean right on hover.
function TicketRow({ ticket, staff, index, onClick }: { ticket: SupportTicket; staff: boolean; index: number; onClick: () => void }) {
  const { t, locale } = useI18n();
  const label = useStatusLabel(staff);
  const unread = ticket.unread;
  // The newest word in the conversation, said by whom.
  const preview = ticket.lastMessage === null ? ticket.description : (
    <>
      <span className="font-semibold text-white/75">
        {ticket.lastFromStaff ? t.supportFromSupport : staff ? `@${ticket.userDisplayName}` : t.supportYou}:
      </span>{' '}
      {ticket.lastMessage}
    </>
  );
  return (
    <button
      onClick={onClick}
      style={{ '--i': Math.min(index, 8) } as CSSProperties}
      className={`activity-row-in group relative w-full text-left flex items-start gap-3 px-3 py-3 rounded-xl ring-1 ring-inset transition-all duration-200 hover:translate-x-0.5 ${
        unread
          ? 'bg-surface-light/80 ring-accent/25 hover:ring-accent/45'
          : 'bg-surface-light/40 ring-white/[0.06] hover:bg-surface-light/70 hover:ring-white/15'
      } ${ticket.status === 'done' && !unread ? 'opacity-75 hover:opacity-100' : ''}`}
    >
      {unread && <span aria-hidden className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-gradient-to-b from-negative to-positive" />}
      <span className="w-10 h-10 rounded-full bg-white/[0.06] ring-1 ring-white/10 flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105">
        <CategoryIcon category={ticket.category} className="w-7 h-7" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex items-start justify-between gap-2">
          <span className={`text-sm md:text-[15px] min-[2200px]:text-base font-semibold leading-snug line-clamp-2 break-words ${unread ? 'text-white' : 'text-white/85'}`}>{ticket.title}</span>
          <StatusPill status={ticket.status} label={label(ticket.status)} pulse={isViewerTurn(ticket.status, staff)} className="mt-px shrink-0" />
        </span>
        <span className="mt-1 text-[13px] md:text-sm min-[2200px]:text-[15px] text-white/60 leading-snug line-clamp-1 break-words">{preview}</span>
        <span className="mt-1.5 flex items-center gap-1.5 flex-wrap text-xs md:text-[13px] min-[2200px]:text-sm text-white/50">
          {staff && (
            <>
              <Avatar name={ticket.userDisplayName ?? '?'} imageUrl={ticket.userAvatarUrl ?? null} className="w-4 h-4" />
              <span className="truncate max-w-28">@{ticket.userDisplayName}</span>
              {ticket.userCountryCode && <FlagImg code={ticket.userCountryCode} className="inline-block align-middle shrink-0" />}
              <span className="text-white/20">·</span>
            </>
          )}
          <HoverTip label={formatDateTime(ticket.lastActivityAt)}>
            <span>{formatRelativeTime(ticket.lastActivityAt, locale, t.justNow)}</span>
          </HoverTip>
          {ticket.messageCount > 0 && (
            <>
              <span className="text-white/20">·</span>
              <span className="inline-flex items-center gap-1 tabular-nums"><BubbleCountIcon className="w-3.5 h-3.5" />{ticket.messageCount + 1}</span>
            </>
          )}
          {unread && <span className="ml-auto text-accent font-semibold">{t.supportNewActivity}</span>}
        </span>
        {/* The same progress bar as the open ticket, so the list shows at a
            glance how far each one has come. */}
        <ProgressBar status={ticket.status} className="h-1 mt-2.5" delayMs={Math.min(index, 8) * 45 + 250} />
      </span>
      {unread && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_rgba(233,69,96,0.8)] animate-new-glow" />}
    </button>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-start gap-3 px-3 py-3 rounded-xl bg-surface-light/30 animate-pulse">
      <span className="w-10 h-10 rounded-full bg-white/[0.07] shrink-0" />
      <span className="flex-1 space-y-2 pt-1">
        <span className="block h-3 rounded bg-white/[0.07] w-2/3" />
        <span className="block h-3 rounded bg-white/[0.07] w-11/12" />
        <span className="block h-2.5 rounded bg-white/[0.07] w-1/4" />
      </span>
    </div>
  );
}

function TicketList({ tickets, loading, staff, meId, onSelect, onNew }: {
  tickets: SupportTicket[];
  loading: boolean;
  staff: boolean;
  meId: string | undefined;
  onSelect: (ticket: SupportTicket) => void;
  onNew: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="px-5 sm:px-6 py-5 flex flex-col gap-4 support-view-in">
      {!staff && (
        <div className="user-header-wash rounded-2xl ring-1 ring-inset ring-white/10 px-4 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3" style={WASH}>
          <p className="flex-1 text-sm md:text-[15px] min-[2200px]:text-base text-white/75 leading-relaxed">{t.supportOverview}</p>
          <button
            onClick={onNew}
            className="shrink-0 flex items-center justify-center gap-1.5 px-3 py-2 text-[13px] md:text-sm min-[2200px]:text-[15px] font-semibold rounded-xl bg-accent text-white hover:bg-accent/90 shadow-lg shadow-accent/20 transition-all active:scale-95"
          >
            <PlusIcon />
            {t.supportNewTicket}
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-1.5"><SkeletonRow /><SkeletonRow /></div>
      ) : tickets.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10">
          <span className="user-header-wash w-16 h-16 rounded-full ring-1 ring-white/10 bg-white/[0.04] flex items-center justify-center" style={WASH}>
            <SupportIcon className="w-11 h-11" />
          </span>
          <p className="text-sm md:text-[15px] min-[2200px]:text-base text-white/60">{t.supportNoTickets}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {tickets.map((ticket, i) => (
            <TicketRow key={ticket.id} ticket={ticket} staff={staff && ticket.userId !== meId} index={i} onClick={() => onSelect(ticket)} />
          ))}
        </div>
      )}
    </div>
  );
}

function CreateForm({ onBack, onCreated }: { onBack: () => void; onCreated: (id: string) => void }) {
  const { t } = useI18n();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<SupportTicketCategory>('bug');
  const [description, setDescription] = useState('');
  const create = useCreateTicket();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (create.isPending) return;
    create.mutate(
      { title: title.trim(), description: description.trim(), category },
      { onSuccess: (ticket) => onCreated(ticket.id) },
    );
  };

  const inputClass = 'w-full text-white text-sm md:text-[15px] min-[2200px]:text-base rounded-xl ring-1 ring-inset ring-white/10 focus:ring-accent/60 focus:outline-none px-3.5 py-2.5 bg-white/[0.04] placeholder:text-white/50 transition-shadow';

  return (
    <form onSubmit={handleSubmit} className="px-5 sm:px-6 py-5 flex flex-col gap-5 support-view-in">
      <button type="button" onClick={onBack} className="group flex items-center gap-1.5 text-xs md:text-[13px] min-[2200px]:text-sm font-medium text-white/50 hover:text-white/80 transition-colors w-fit">
        <svg className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        {t.supportBack}
      </button>

      <div>
        <label className="block text-[13px] md:text-sm min-[2200px]:text-[15px] font-semibold text-white/80 mb-2">{t.supportCategoryLabel}</label>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => {
            const on = category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                aria-pressed={on}
                // Every chip keeps its red-green icon - colour is the
                // category, not the selection. The pick is the frame: red
                // ring, soft glow and a check that slides in before the icon.
                className={`group flex items-center pl-2 pr-3 py-1.5 rounded-full text-[13px] md:text-sm min-[2200px]:text-[15px] ring-1 ring-inset transition-all duration-200 ${
                  on
                    ? 'ring-accent/70 bg-accent/15 text-white shadow-[0_0_14px_-3px_rgba(233,69,96,0.6)]'
                    : 'ring-white/10 bg-white/[0.04] text-white/75 hover:ring-white/25 hover:bg-white/[0.07] hover:text-white hover:-translate-y-0.5'
                }`}
              >
                <span
                  aria-hidden
                  className={`flex items-center overflow-hidden transition-all duration-200 ease-out ${on ? 'w-3.5 mr-1 opacity-100' : 'w-0 opacity-0'}`}
                >
                  <svg className={`w-3.5 h-3.5 shrink-0 text-accent ${on ? 'send-check' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <CategoryIcon category={cat} className="w-4 h-4 mr-1.5 transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-6" />
                {t.supportCategories[cat]}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label htmlFor="support-title" className="block text-[13px] md:text-sm min-[2200px]:text-[15px] font-semibold text-white/80 mb-2">{t.supportTitleLabel}</label>
        <input
          id="support-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t.supportTitlePlaceholder}
          maxLength={255}
          required
          className={inputClass}
          style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
        />
      </div>

      <div>
        <label htmlFor="support-details" className="block text-[13px] md:text-sm min-[2200px]:text-[15px] font-semibold text-white/80 mb-2">{t.supportDescriptionLabel}</label>
        <textarea
          id="support-details"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t.supportDescriptionPlaceholder}
          rows={6}
          maxLength={5000}
          required
          className={`${inputClass} resize-none leading-relaxed`}
          style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
        />
        <p className="text-xs min-[2200px]:text-[13px] text-white/50 text-right mt-1 tabular-nums">{description.length}/5000</p>
      </div>

      {create.isError && <p role="alert" className="text-[13px] md:text-sm min-[2200px]:text-[15px] text-negative-soft -mt-2">{create.error.message}</p>}

      <button
        type="submit"
        disabled={create.isPending || !title.trim() || !description.trim()}
        className="relative w-full py-3 rounded-xl bg-accent text-white text-sm md:text-[15px] min-[2200px]:text-base font-semibold hover:bg-accent/90 shadow-lg shadow-accent/20 disabled:shadow-none disabled:bg-white/[0.06] disabled:text-white/30 disabled:cursor-not-allowed transition-all active:scale-[0.99]"
      >
        <span className={create.isPending ? 'invisible' : ''}>{t.supportSubmit}</span>
        {create.isPending && (
          <span className="absolute inset-0 flex items-center justify-center" aria-hidden>
            <svg className="w-4 h-4 animate-spin motion-reduce:animate-none" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
              <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </span>
        )}
      </button>
    </form>
  );
}

type View = 'list' | 'create' | { ticketId: string };

function useSupportView() {
  // A bell line opens the window on its ticket (router state from the bell).
  const location = useLocation();
  const initial = (location.state as { ticketId?: string } | null)?.ticketId;
  return useState<View>(initial ? { ticketId: initial } : 'list');
}

export function SupportModal({ onClose }: SupportModalProps) {
  const { t } = useI18n();
  const { data: me } = useMe();
  const { promptSignIn } = useSignIn();
  const [view, setView] = useSupportView();
  const [tab, setTab] = useState<'tickets' | 'reports'>('tickets');
  const isAnonymous = !me?.user || me.user.tier === 'anonymous';
  const isAdmin = me?.user?.tier === 'admin';
  const { data: tickets = [], isPending } = useSupportTickets(!isAnonymous);
  const { data: reports = [] } = useReports(isAdmin);
  const ticketId = typeof view === 'object' ? view.ticketId : null;

  let body;
  if (isAnonymous) {
    body = (
      <div className="px-6 py-10 flex flex-col items-center gap-3 text-center">
        <span className="user-header-wash w-16 h-16 rounded-full ring-1 ring-white/10 bg-white/[0.04] flex items-center justify-center" style={WASH}>
          <SupportIcon className="w-11 h-11" />
        </span>
        <p className="text-sm md:text-[15px] min-[2200px]:text-base text-white/60">{t.supportSignIn}</p>
        <ActionChip onClick={promptSignIn} className="mt-1">
          <SignInIcon className="w-3.5 h-3.5" />
          <span>{t.login}</span>
        </ActionChip>
      </div>
    );
  } else if (ticketId) {
    body = <TicketThread key={ticketId} ticketId={ticketId} onBack={() => setView('list')} />;
  } else if (view === 'create') {
    body = <CreateForm onBack={() => setView('list')} onCreated={(id) => setView({ ticketId: id })} />;
  } else {
    const list = (
      <TicketList
        tickets={tickets}
        loading={isPending}
        staff={isAdmin}
        meId={me?.user?.id}
        onSelect={(ticket) => setView({ ticketId: ticket.id })}
        onNew={() => setView('create')}
      />
    );
    if (!isAdmin) {
      body = list;
    } else {
      // Support sees everyone's tickets plus the reported opinios. The tab's
      // count = what still needs a look.
      const open = tickets.filter((x) => x.status === 'new' || x.status === 'investigating').length;
      const tabClass = (active: boolean) =>
        `flex items-center gap-1.5 px-3 py-1.5 text-sm md:text-[15px] min-[2200px]:text-base font-medium rounded-full ring-1 ring-inset transition-colors ${
          active ? 'ring-accent/60 bg-accent/15 text-white' : 'ring-white/10 text-white/60 hover:ring-white/25 hover:text-white/80'
        }`;
      const count = (n: number) => n > 0 && (
        <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-white text-[10px] font-bold leading-[18px] text-center">{n}</span>
      );
      body = (
        <div>
          <div className="flex gap-2 px-5 sm:px-6 pt-4">
            <button onClick={() => setTab('tickets')} className={tabClass(tab === 'tickets')}>{t.ticketsTab}{count(open)}</button>
            <button onClick={() => setTab('reports')} className={tabClass(tab === 'reports')}>{t.reportsTab}{count(reports.length)}</button>
          </div>
          {tab === 'tickets' ? list : <ReportsList onClose={onClose} t={t} />}
        </div>
      );
    }
  }

  return (
    <ModalShell
      onClose={onClose}
      title={t.supportTitle}
      titleAs="h1"
      icon={<SupportIcon />}
      maxWidth="max-w-xl min-[2200px]:max-w-3xl"
      desktopScrollable
      footer={ticketId && !isAnonymous ? <TicketComposer ticketId={ticketId} /> : undefined}
    >
      {body}
    </ModalShell>
  );
}
