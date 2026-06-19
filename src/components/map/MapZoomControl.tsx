import { useRef, useCallback } from 'react';

interface MapZoomControlProps {
  scale: number;
  min: number;
  max: number;
  /** Set an absolute zoom level (clamped by the parent), keeping the map centered. */
  onZoom: (scale: number) => void;
  /** Multiply the current zoom by a factor (for the +/- buttons; compounds on rapid clicks). */
  onStep: (factor: number) => void;
}

// Vertical zoom slider + readout, parked in the empty ocean bottom-right. The
// thumb is draggable; +/- step by a fixed factor. Top of the track = max zoom.
export function MapZoomControl({ scale, min, max, onZoom, onStep }: MapZoomControlProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const frac = Math.max(0, Math.min(1, (scale - min) / (max - min)));

  const setFromClientY = useCallback((clientY: number) => {
    const el = trackRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    let f = 1 - (clientY - r.top) / r.height; // top = max zoom
    f = Math.max(0, Math.min(1, f));
    onZoom(min + f * (max - min));
  }, [min, max, onZoom]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFromClientY(e.clientY);
    const move = (ev: PointerEvent) => setFromClientY(ev.clientY);
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }, [setFromClientY]);

  const step = (dir: 1 | -1) => onStep(dir === 1 ? 1.3 : 1 / 1.3);

  const btn =
    'w-9 h-9 flex items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors text-2xl font-bold leading-none';

  return (
    <div className="absolute bottom-4 right-4 z-10 select-none flex flex-col items-center gap-2.5 rounded-xl bg-surface/80 backdrop-blur-sm ring-1 ring-border px-2.5 py-3">
      <button className={btn} onClick={() => step(1)} aria-label="Zoom in">+</button>
      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        style={{ cursor: 'ns-resize' }}
        className="relative w-2.5 h-40 rounded-full bg-white/15"
      >
        <div
          className="absolute left-0 right-0 bottom-0 rounded-full bg-accent/70"
          style={{ height: `${frac * 100}%` }}
        />
        <div
          className="absolute left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white shadow ring-1 ring-black/30"
          style={{ bottom: `calc(${frac * 100}% - 10px)` }}
        />
      </div>
      <button className={btn} onClick={() => step(-1)} aria-label="Zoom out">&#8722;</button>
      <span className="mt-0.5 text-[13px] font-semibold tabular-nums text-white/60">{scale.toFixed(1)}&#215;</span>
    </div>
  );
}
