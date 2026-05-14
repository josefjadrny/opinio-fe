import { useRef, useState, useCallback } from 'react';

export interface Particle {
  id: number;
  streak: number;
}

let particleId = 0;
const STREAK_WINDOW_MS = 800;

export function useVoteAnimation() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const streakRef = useRef(0);
  const lastClickRef = useRef(0);
  const bumpKeyRef = useRef(0);
  const [bumpKey, setBumpKey] = useState(0);

  const trigger = useCallback(() => {
    const now = Date.now();
    if (now - lastClickRef.current < STREAK_WINDOW_MS) {
      streakRef.current += 1;
    } else {
      streakRef.current = 1;
    }
    lastClickRef.current = now;

    const id = ++particleId;
    const streak = streakRef.current;

    setParticles((prev) => [...prev, { id, streak }]);
    setTimeout(() => setParticles((prev) => prev.filter((p) => p.id !== id)), 750);

    bumpKeyRef.current += 1;
    setBumpKey(bumpKeyRef.current);
  }, []);

  return { particles, bumpKey, trigger };
}
