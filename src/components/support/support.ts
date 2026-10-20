import { useI18n } from '../../i18n/I18nContext';
import type { SupportTicketStatus } from '../../types/api';

// Status colours: amber is the ticket-status hue (CLAUDE.md reserves it for
// statuses and the Supporter badge), the accent marks a ticket nobody has
// opened, green a resolved one. `pulse` = the ball is in the viewer's court.
export const STATUS_STYLE: Record<SupportTicketStatus, { pill: string; dot: string }> = {
  new: { pill: 'bg-accent/15 text-accent ring-accent/30', dot: 'bg-accent' },
  investigating: { pill: 'bg-amber-500/15 text-amber-300 ring-amber-400/30', dot: 'bg-amber-400' },
  waiting: { pill: 'bg-orange-500/15 text-orange-300 ring-orange-400/30', dot: 'bg-orange-400' },
  done: { pill: 'bg-positive/15 text-positive ring-positive/30', dot: 'bg-positive' },
};

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

// Whose move it is: support's on a new or investigating ticket, the user's on
// a waiting one. That side's status pill breathes.
export function isViewerTurn(status: SupportTicketStatus, staff: boolean) {
  return staff ? status === 'new' || status === 'investigating' : status === 'waiting';
}

// The status labels as the viewer reads them: "Waiting for you" to the user
// is "Waiting for user" to support.
export function useStatusLabel(staff: boolean) {
  const { t } = useI18n();
  return (s: SupportTicketStatus) => (staff ? t.supportStatusesStaff : t.supportStatuses)[s] ?? s;
}

// Three stops - received, being handled, resolved - on a bar that fills in
// the brand's red-to-green as the ticket moves. "Waiting" sits a little past
// "in progress": support has answered, the ticket is further along.
export const PROGRESS: Record<SupportTicketStatus, number> = { new: 12, investigating: 50, waiting: 68, done: 100 };
