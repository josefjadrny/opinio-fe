// The poll marks, one family: a box is a poll (a ballot), a bubble is talk
// (CommentIcon). Two-tone like every app icon - the shape in the brand red,
// the accent in the brand green. Used by the header add button, the mobile
// FAB, the new-poll window and the user's activity rows; keep them all here so
// they cannot drift apart.

interface IconProps {
  className?: string;
  /** Accent stroke; the FAB draws it a little heavier at its 36px size. */
  accentWidth?: number;
}

/** Ask a new poll / "asked" in activity: a box with a plus. */
export function NewPollIcon({ className = 'w-4 h-4', accentWidth = 2.5 }: IconProps) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} aria-hidden>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" stroke="var(--color-negative)" />
      <path stroke="var(--color-positive)" strokeLinecap="round" strokeLinejoin="round" strokeWidth={accentWidth} d="M12 8.25v7.5M8.25 12h7.5" />
    </svg>
  );
}

/** "Voted" in activity: a box with a tick - that a vote happened, never which answer. */
export function VotedIcon({ className = 'w-4 h-4', accentWidth = 2.5 }: IconProps) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} aria-hidden>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" stroke="var(--color-negative)" />
      <path stroke="var(--color-positive)" strokeLinecap="round" strokeLinejoin="round" strokeWidth={accentWidth} d="M8.25 12.5l2.5 2.5 5-5.25" />
    </svg>
  );
}

/** Countries: a globe, red rim with a green grid - the Countries tab and the
 *  "countries" figure under a poll's answers. */
export function GlobeIcon({ className = 'w-4 h-4', accentWidth = 2 }: IconProps) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} aria-hidden>
      <path stroke="var(--color-negative)" strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      <path stroke="var(--color-positive)" strokeLinecap="round" strokeLinejoin="round" strokeWidth={accentWidth} d="M3 12h18M12 3a15.3 15.3 0 014 9 15.3 15.3 0 01-4 9 15.3 15.3 0 01-4-9 15.3 15.3 0 014-9z" />
    </svg>
  );
}
