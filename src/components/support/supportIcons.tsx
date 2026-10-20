import type { SupportTicketCategory, SupportTicketStatus } from '../../types/api';
import { STATUS_STYLE, PROGRESS } from './support';

// Support's icons, built like the bell and add-opinio: a red outline shape
// carrying a green mark. `mono` draws both in currentColor (disabled rows,
// the anonymous menu entry).

type IconProps = { className?: string; mono?: boolean };

function colors(mono: boolean) {
  return {
    red: mono ? 'currentColor' : 'var(--color-negative)',
    green: mono ? 'currentColor' : 'var(--color-positive)',
  };
}

// The window's own icon: a speech bubble with a check inside - "asked and
// answered".
export function SupportIcon({ className = '', mono = false }: IconProps) {
  const { red, green } = colors(mono);
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" aria-hidden>
      <path
        stroke={red} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"
        d="M12 3.75c-4.7 0-8.25 3.2-8.25 7.25 0 1.75.66 3.35 1.78 4.6l-.78 3.65 3.85-1.5c1.05.42 2.2.65 3.4.65 4.7 0 8.25-3.2 8.25-7.4S16.7 3.75 12 3.75z"
      />
      <path stroke={green} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M8.6 11.2l2.3 2.2 4.5-4.5" />
    </svg>
  );
}

const CATEGORY_PATHS: Record<SupportTicketCategory, { red: string; green: string }> = {
  // A bug: body + legs in red, the head's eyes in green.
  bug: {
    red: 'M8.5 10.5a3.5 3.5 0 017 0V15a3.5 3.5 0 01-7 0v-4.5zM8.5 12.5H5M19 12.5h-3.5M8.6 16H5.5M18.5 16h-3.1M9 9L6.5 7M15 9l2.5-2M12 11.5V18',
    green: 'M10 7.5a2 2 0 014 0',
  },
  // A light bulb with a green filament.
  feature: {
    red: 'M9 17.5h6M10 20.25h4M12 3.75a5.75 5.75 0 00-3.4 10.4c.55.4.9 1.05.9 1.75v.1h5v-.1c0-.7.35-1.35.9-1.75A5.75 5.75 0 0012 3.75z',
    green: 'M10.5 10.5l1.5 1.5 1.5-1.5',
  },
  // A card with its green stripe.
  subscription: {
    red: 'M4.75 6.75h14.5a1 1 0 011 1v8.5a1 1 0 01-1 1H4.75a1 1 0 01-1-1v-8.5a1 1 0 011-1z',
    green: 'M3.75 10h16.5M7 14.25h3',
  },
  // A person, the head in green.
  account: {
    red: 'M5.5 19.25c.6-3.2 3.3-5.25 6.5-5.25s5.9 2.05 6.5 5.25',
    green: 'M12 11.25a3.25 3.25 0 100-6.5 3.25 3.25 0 000 6.5z',
  },
  // A tag with a green hole.
  other: {
    red: 'M4.25 12.6V5.25a1 1 0 011-1h7.35a1 1 0 01.7.3l6.4 6.4a1 1 0 010 1.4l-7.35 7.35a1 1 0 01-1.4 0l-6.4-6.4a1 1 0 01-.3-.7z',
    green: 'M8.75 8.75h.01',
  },
};

export function CategoryIcon({ category, className = '', mono = false }: IconProps & { category: SupportTicketCategory }) {
  const { red, green } = colors(mono);
  const p = CATEGORY_PATHS[category] ?? CATEGORY_PATHS.other;
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" aria-hidden>
      <path stroke={red} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" d={p.red} />
      <path stroke={green} strokeWidth={category === 'other' ? 3 : 2} strokeLinecap="round" strokeLinejoin="round" d={p.green} />
    </svg>
  );
}

export function StatusPill({ status, label, pulse = false, className = '' }: { status: SupportTicketStatus; label: string; pulse?: boolean; className?: string }) {
  const st = STATUS_STYLE[status] ?? STATUS_STYLE.new;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs min-[2200px]:text-[13px] font-semibold ring-1 ring-inset whitespace-nowrap ${st.pill} ${className}`}>
      <span className="relative flex w-1.5 h-1.5">
        {pulse && <span className={`absolute inset-0 rounded-full ${st.dot} opacity-70 animate-ping motion-reduce:animate-none`} />}
        <span className={`relative w-1.5 h-1.5 rounded-full ${st.dot}`} />
      </span>
      {label}
    </span>
  );
}

// The ticket's progress as a bar in the brand's red-to-green. The ramp spans
// the whole track and the fill only uncovers it, so a half-done ticket ends
// in amber at any width. It draws itself in from the left on mount and
// glides when the status moves.
export function ProgressBar({ status, className = 'h-1', delayMs = 0 }: { status: SupportTicketStatus; className?: string; delayMs?: number }) {
  const pct = PROGRESS[status] ?? 0;
  return (
    <span className={`relative block rounded-full bg-white/[0.07] overflow-hidden ${className}`}>
      <span
        className="absolute inset-y-0 left-0 overflow-hidden rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none"
        style={{ width: `${pct}%`, animation: 'bar-fill 0.7s cubic-bezier(0.22, 1, 0.36, 1) both', animationDelay: `${delayMs}ms`, transformOrigin: 'left' }}
      >
        <span
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-negative via-amber-400 to-positive"
          style={{ width: `${pct > 0 ? 10000 / pct : 100}%` }}
        />
      </span>
    </span>
  );
}
