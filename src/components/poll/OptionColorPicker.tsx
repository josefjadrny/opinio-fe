import { useEffect, useRef, useState } from 'react';
import { OPTION_COLORS } from '../../utils/pollColors';
import { HoverTip } from '../common/HoverTip';

// The swatch beside an answer in the add form; a tap opens the 3x3 palette.
// A colour another answer holds is marked, and picking it swaps the two, so
// two answers never share a colour (the API refuses that).
export function OptionColorPicker({ value, taken, onPick, label }: {
  value: string;
  /** Colours of the other answers. */
  taken: string[];
  onPick: (color: string) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (!wrapRef.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); } };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey, true);
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey, true); };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative shrink-0">
      <HoverTip label={label}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={label}
          aria-expanded={open}
          className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/5 transition-colors"
        >
          <span className="w-5 h-5 rounded-full ring-2 ring-white/15" style={{ background: value }} />
        </button>
      </HoverTip>
      {open && (
        <div role="listbox" aria-label={label} className="absolute left-0 top-full mt-1 z-30 w-max grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-surface border border-border shadow-xl">
          {OPTION_COLORS.map((c) => {
            const selected = c === value;
            const isTaken = !selected && taken.includes(c);
            return (
              <button
                key={c}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => { onPick(c); setOpen(false); }}
                className={`relative w-8 h-8 rounded-full transition-transform hover:scale-110 ${selected ? 'ring-2 ring-white ring-offset-2 ring-offset-surface' : ''}`}
                style={{ background: c }}
              >
                {isTaken && <span aria-hidden className="absolute inset-[11px] rounded-full bg-surface/80" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
