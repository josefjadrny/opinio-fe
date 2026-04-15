import { useState, useEffect } from 'react';

/** Returns formatted mm:ss countdown to a future ISO timestamp, or null if no timestamp / already past. */
export function useCountdown(isoTimestamp: string | null | undefined): string | null {
  const [remaining, setRemaining] = useState<number | null>(null);

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

  if (remaining === null) return null;

  const totalSeconds = Math.ceil(remaining / 1000);
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
