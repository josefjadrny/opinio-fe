import { useEffect, useState } from 'react';

// Polls take votes until endsAt (POLLS-DESIGN.md "End date"). The last
// ENDING_SOON_MS before it, lists show a quiet "Ends in 2 days" teaser.
export const ENDING_SOON_MS = 3 * 24 * 60 * 60 * 1000;

export type PollPhase = 'open' | 'soon' | 'ended';

function phaseAt(endsAt: string | undefined, now: number): PollPhase {
  if (!endsAt) return 'open';
  const left = new Date(endsAt).getTime() - now;
  return left <= 0 ? 'ended' : left <= ENDING_SOON_MS ? 'soon' : 'open';
}

// Where a poll stands against its end date, re-rendering as it changes: a
// minute tick in the last 3 days, otherwise one timer to that boundary
// (setTimeout caps at ~24.8 days; a longer wait re-arms). The server
// is the authority - this only keeps an open page from offering a dead vote.
export function usePollDeadline(endsAt: string | undefined): PollPhase {
  const [now, setNow] = useState(() => Date.now());
  const phase = phaseAt(endsAt, now);

  useEffect(() => {
    if (!endsAt || phase === 'ended') return;
    const end = new Date(endsAt).getTime();
    const next = phase === 'soon'
      ? Math.min(60_000, end - Date.now())
      : end - ENDING_SOON_MS - Date.now();
    const id = setTimeout(() => setNow(Date.now()), Math.min(Math.max(next, 0) + 50, 2 ** 31 - 1));
    return () => clearTimeout(id);
  }, [endsAt, phase, now]);

  return phase;
}
