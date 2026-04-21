let lockedUntil = 0;
let pendingTimer: ReturnType<typeof setTimeout> | undefined;

export function lockOrderFor5s(onUnlock: () => void) {
  lockedUntil = Date.now() + 5_000;
  clearTimeout(pendingTimer);
  pendingTimer = setTimeout(() => {
    lockedUntil = 0;
    onUnlock();
  }, 5_000);
}

export function isOrderLocked() {
  return Date.now() < lockedUntil;
}
