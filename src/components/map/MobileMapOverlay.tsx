import { useState, useRef, useCallback, useEffect } from 'react';
import { MobileMap } from './MobileMap';
import { WIDTH, HEIGHT } from './mapShared';

const HANDLE_H = 40;
const MAP_ASPECT = HEIGHT / WIDTH;
const MAX_VIEWPORT_FRACTION = 0.66;
const FILTERBAR_H = 63; // overlay starts just below the sticky filter bar

// Option B: the feed stays full-height and untouched; the map is hidden behind a
// floating globe button. Dragging the globe up (or tapping it) slides a map
// overlay DOWN from under the filter bar over the feed; a scrim dims the feed
// behind it and tapping the scrim (or the handle) slides it back up. `progress`
// is 0 (closed) .. 1 (fully open) and is driven continuously while dragging so
// the reveal is gradual, then snaps to whichever end is nearer on release.
export function MobileMapOverlay() {
  const panelH = () =>
    Math.round(Math.min(window.innerWidth * MAP_ASPECT, window.innerHeight * MAX_VIEWPORT_FRACTION)) + HANDLE_H;
  const [height, setHeight] = useState(panelH);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ startY: number; startProgress: number; moved: boolean } | null>(null);

  useEffect(() => {
    const onResize = () => setHeight(panelH());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const startDrag = useCallback((e: React.PointerEvent, dir: 1 | -1) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startY: e.clientY, startProgress: progress, moved: false };
    setDragging(true);
    (e.currentTarget as HTMLElement).dataset.dir = String(dir);
  }, [progress]);

  const onMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    // Dragging up on the globe (dir -1) or down on the handle (dir +1) both open;
    // convert vertical travel to a 0..1 fraction of the panel height.
    const dir = Number((e.currentTarget as HTMLElement).dataset.dir) || 1;
    const travel = (d.startY - e.clientY) * dir; // positive = opening
    if (Math.abs(d.startY - e.clientY) > 3) d.moved = true;
    setProgress(Math.max(0, Math.min(1, d.startProgress + travel / height)));
  }, [height]);

  const endDrag = useCallback(() => {
    const d = dragRef.current;
    dragRef.current = null;
    setDragging(false);
    if (!d) return;
    if (!d.moved) {
      setProgress((p) => (p > 0.5 ? 0 : 1)); // tap = toggle
      return;
    }
    setProgress((p) => (p >= 0.5 ? 1 : 0)); // snap
  }, []);

  const open = progress > 0.02;

  return (
    <>
      {/* Scrim over the feed while the map is open. */}
      <div
        onClick={() => setProgress(0)}
        className="fixed inset-x-0 bottom-0 z-40"
        style={{
          top: FILTERBAR_H,
          background: 'rgba(0,0,0,0.5)',
          opacity: progress,
          pointerEvents: open ? 'auto' : 'none',
          transition: dragging ? 'none' : 'opacity 260ms ease',
        }}
      />

      {/* Sliding map panel. */}
      <div
        className="fixed inset-x-0 z-50 bg-surface border-b border-border overflow-hidden shadow-2xl"
        style={{
          top: FILTERBAR_H,
          height,
          // Fully off-screen when closed: beyond -100% we add the handle height +
          // the filter-bar offset so the bottom grab bar clears the top of the
          // screen too - a closed overlay shows nothing but the globe button.
          transform: `translateY(calc(${(progress - 1) * 100}% - ${(1 - progress) * (HANDLE_H + FILTERBAR_H + 4)}px))`,
          transition: dragging ? 'none' : 'transform 260ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <div className="absolute inset-x-0 top-0" style={{ height: height - HANDLE_H }}>
          <MobileMap />
        </div>
        {/* Grab handle at the bottom edge - drag up to close, down to open more. */}
        <div
          role="button"
          aria-label="Close map"
          onPointerDown={(e) => startDrag(e, 1)}
          onPointerMove={onMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-surface/95 backdrop-blur-sm border-t border-border select-none"
          style={{ height: HANDLE_H, cursor: 'ns-resize', touchAction: 'none' }}
        >
          <span className="absolute left-1/2 top-1.5 -translate-x-1/2 w-10 h-1 rounded-full bg-white/25" />
          <span className="text-xs font-semibold uppercase tracking-wider text-white/60">World map</span>
          <svg className="w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </div>
      </div>

      {/* Floating globe button - drag up or tap to reveal the map. Fades out as
          the overlay opens so it doesn't sit on top of the map. */}
      <button
        aria-label="Open map"
        onPointerDown={(e) => startDrag(e, -1)}
        onPointerMove={onMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="fixed bottom-24 right-4 z-40 w-14 h-14 flex items-center justify-center rounded-full bg-accent text-white shadow-2xl ring-1 ring-black/20"
        style={{
          touchAction: 'none',
          opacity: 1 - progress,
          pointerEvents: open ? 'none' : 'auto',
          transition: dragging ? 'none' : 'opacity 200ms ease',
        }}
      >
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18zM3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 010 18M12 3a15 15 0 000 18" />
        </svg>
      </button>
    </>
  );
}
