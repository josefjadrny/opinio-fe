import { useRef, useState, type ReactNode } from 'react';
import { AnchoredTip, TIP_TEXT_CLASS } from './AnchoredTip';

interface HoverTipProps {
  /** The one-line explainer. Falsy renders the children bare - callers pass
   *  their conditional straight through instead of branching around the tip. */
  label?: string | null;
  /** Wrapper classes. The default is a shrink-wrapped inline box; pass
   *  `contents` when the child sizes itself (w-full buttons, absolutely
   *  positioned badges) and the wrapper must not add a box of its own. */
  className?: string;
  /** Multi-line contents instead of the plain `label` line; `label` then
   *  only keys re-measurement. Keep it short - this is still a tooltip. */
  panel?: ReactNode;
  /** Padding for a `panel`; the one-line default is tighter. */
  panelClassName?: string;
  /** Fixed width for a `panel`; the default sizes to the content. */
  panelWidth?: number;
  /** The trigger - a button, link, chip or any hoverable element. */
  children: ReactNode;
}

// Names a control on hover, in the same panel the vote counts use
// (AnchoredTip). The site-wide replacement for `title=`: the native tooltip
// takes about a second to appear, renders in the OS's own light chrome on a
// dark card, and can't be styled - and the two would stack on one element.
// Everything that only needs a line of text goes through here; StatTip is
// the sibling for readable figures, whose trigger contract differs (touch
// opens it, cursor-help).
//
// Mouse and keyboard only, deliberately:
//
//   - `pointerenter` fires with pointerType 'touch' on a tap in Chrome, so
//     without the guard a tap would leave the panel up until the next tap
//     elsewhere - and on a touch device the label is redundant anyway, since
//     the tap has already run the action.
//   - Focus opens it only when the focus is `:focus-visible`, i.e. keyboard.
//     A plain click focuses the button too, and without that check clicking
//     share would pop the label open and leave it there.
//   - `pointerdown` closes: once the action has run (a dialog opening, the
//     modal closing) the label is describing something that already happened.
//
// The panel is anchored to the first element child, not the wrapper, so a
// `contents` wrapper (no box to measure) still centres the panel on the
// control, and the default wrapper's box coincides with the child's anyway.
// Enter/leave are computed on the DOM tree, so a `contents` wrapper still
// receives them.
export function HoverTip({ label, panel, panelClassName = 'px-2.5 py-1.5', panelWidth, className = 'inline-flex shrink-0', children }: HoverTipProps) {
  // The open state IS the anchor: resolved from the ref inside the event
  // handler (not during render), null when closed.
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const open = () => {
    const el = wrapRef.current;
    setAnchor((el?.firstElementChild as HTMLElement | null) ?? el);
  };
  const close = () => setAnchor(null);

  if (!label) return <>{children}</>;

  return (
    <span
      ref={wrapRef}
      className={className}
      onPointerEnter={(e) => { if (e.pointerType === 'mouse') open(); }}
      onPointerLeave={close}
      onPointerDown={close}
      onFocus={(e) => { if ((e.target as HTMLElement).matches?.(':focus-visible')) open(); }}
      onBlur={close}
    >
      {children}
      {anchor && (
        <AnchoredTip anchorEl={anchor} width={panelWidth} content={label} className={panelClassName}>
          {panel ?? <span className={`block whitespace-nowrap ${TIP_TEXT_CLASS}`}>{label}</span>}
        </AnchoredTip>
      )}
    </span>
  );
}
