import { useSyncExternalStore } from 'react';

// Whether this browser has had the welcome: the strip dismissed, its "How it
// works" taken, or the /welcome window closed. Shared by the strip, the
// /welcome route, the viewer-mode gate and the Android promo (which waits its
// turn while the strip is pending), so it is one store all of them re-render
// from rather than a localStorage read each makes once.

const KEY = 'opinio_welcome_seen_v1';
const listeners = new Set<() => void>();

function read(): boolean {
  // Storage blocked (private mode) counts as seen: the strip would otherwise
  // come back on every page with no way to make it stay gone.
  try { return localStorage.getItem(KEY) === '1'; } catch { return true; }
}

export function welcomeSeen(): boolean {
  return read();
}

export function markWelcomeSeen(): void {
  try { localStorage.setItem(KEY, '1'); } catch { /* private mode - read() already says seen */ }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

export function useWelcomeSeen(): boolean {
  return useSyncExternalStore(subscribe, read, () => true);
}
