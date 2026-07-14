import { useCallback, useEffect, useRef, type TouchEvent } from 'react';

// Drag-to-dismiss for the mobile bottom sheets (Android-style). The sheet
// follows the finger downward; releasing past DISMISS_PX - or flinging faster
// than FLING_V regardless of distance - closes it, anything shorter springs
// back. Upward drag is clamped to 0 so the sheet can't be pulled off the top.
//
// The TWA is just Chrome, so this one implementation serves both the Android
// app and mobile web; there is no native sheet to defer to.
//
// The transform is written straight to the node rather than held in state: a
// re-render per touchmove would repaint the whole sheet subtree ~60x/sec and
// drops frames on low-end Android. This way the drag costs zero renders and
// the compositor handles translateY on its own thread.
const DISMISS_PX = 90;
const FLING_V = 0.5;   // px/ms
const FLING_MIN_PX = 16;
const IDLE_MS = 100;   // finger held still this long at release => not a fling
const EXIT_MS = 180;
const SPRING_MS = 200;

export function useSheetDrag(onClose: () => void) {
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const start = useRef({ y: 0, t: 0 });
  const prev = useRef({ y: 0, t: 0 });
  const last = useRef({ y: 0, t: 0 });
  const exitTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(exitTimer.current), []);

  const onTouchStart = useCallback((e: TouchEvent) => {
    const t = e.touches[0];
    start.current = { y: t.clientY, t: performance.now() };
    prev.current = start.current;
    last.current = start.current;
    if (sheetRef.current) sheetRef.current.style.transition = 'none';
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    const t = e.touches[0];
    prev.current = last.current;
    last.current = { y: t.clientY, t: performance.now() };
    const dy = Math.max(0, t.clientY - start.current.y);
    if (sheetRef.current) sheetRef.current.style.transform = `translateY(${dy}px)`;
  }, []);

  const onTouchEnd = useCallback(() => {
    const node = sheetRef.current;
    const dy = Math.max(0, last.current.y - start.current.y);

    // Velocity from the final two samples, not the whole gesture: a fast pull
    // followed by holding the finger still must not read as a fling. A gap
    // since the last move means the finger was parked -> velocity is zero.
    const idle = performance.now() - last.current.t;
    const dt = last.current.t - prev.current.t;
    const velocity = idle > IDLE_MS || dt <= 0 ? 0 : (last.current.y - prev.current.y) / dt;

    const dismiss = dy >= DISMISS_PX || (velocity >= FLING_V && dy >= FLING_MIN_PX);

    if (!node) {
      if (dismiss) onClose();
      return;
    }

    if (dismiss) {
      // Slide fully out before unmounting - closing mid-drag would make the
      // sheet vanish from wherever the finger left it.
      node.style.transition = `transform ${EXIT_MS}ms ease-out`;
      node.style.transform = `translateY(${window.innerHeight}px)`;
      exitTimer.current = window.setTimeout(onClose, EXIT_MS);
    } else {
      node.style.transition = `transform ${SPRING_MS}ms ease-out`;
      node.style.transform = '';
    }
  }, [onClose]);

  // Spread on the grab area (handle strip + header). touchAction 'none' keeps
  // the browser from claiming the gesture as a scroll/pull-to-refresh.
  const dragHandlers = {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onTouchCancel: onTouchEnd,
    style: { touchAction: 'none' as const },
  };

  return { sheetRef, dragHandlers };
}
