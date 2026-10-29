import { useState, useEffect } from 'react';

export interface CountdownResult {
  text: string | null;
  remainingMs: number | null;
}

/** Returns formatted mm:ss countdown and raw ms remaining to a future ISO timestamp. */
export function useCountdown(isoTimestamp: string | null | undefined): CountdownResult {
  // Seeded on the first render, not left null until the effect's first tick -
  // a caller reading "null = expired" would otherwise see a false zero on mount.
  const [remaining, setRemaining] = useState<number | null>(() => {
    if (!isoTimestamp) return null;
    const ms = new Date(isoTimestamp).getTime() - Date.now();
    return ms > 0 ? ms : null;
  });

  useEffect(() => {
    if (!isoTimestamp) {
      setRemaining(null);
      return;
    }

    const tick = () => {
      const ms = new Date(isoTimestamp).getTime() - Date.now();
      setRemaining(ms > 0 ? ms : null);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isoTimestamp]);

  if (remaining === null) return { text: null, remainingMs: null };

  const totalSeconds = Math.ceil(remaining / 1000);
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return { text: `${m}:${s}`, remainingMs: remaining };
}
