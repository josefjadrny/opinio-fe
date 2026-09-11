import { useLayoutEffect, useRef } from 'react';

// How long a card takes to travel to its new slot. Symmetric easing, not the
// fast-start curve it had: a card that covers most of its distance in the
// first 200ms is a card you only ever see arriving, and "which one moved" is
// the question the animation exists to answer.
const MOVE_MS = 1400;
const MOVE_EASING = 'cubic-bezier(0.45, 0, 0.2, 1)';
// How long the mover keeps its glow ring after landing - long enough to look
// up from the map, short enough that two swaps in a row don't leave the list
// studded with rings. Matches the CSS animation length in index.css
// (flip-glow), which does the actual fading.
const LINGER_MS = 4500;

type Pos = { top: number; left: number; index: number };

// FLIP-style reorder animation. Wrap each direct child in <div data-flip-key={id}>
// inside the container ref returned here. When the container's children change
// position between renders, each moved child briefly translates from its old
// position and animates back to its new one.
//
// On top of the slide, the child that actually MOVED - as opposed to the ones
// it pushed out of the way - carries data-flip-move="up|down" for LINGER_MS,
// which index.css turns into a glow ring in the direction colour that fades
// out on its own. The distinction
// matters: a card jumping over three others displaces three cards by one slot
// each, and lighting up all four says nothing. So a card is a mover when it
// jumped two or more places, or when it is one side of a plain two-card swap -
// two cards that moved one place each AND exchanged slots with each other.
// That is a structural test, not a batch-size one: a swap has to be recognised
// even when it lands in the same refetch as an unrelated jump (the reader's
// own vote and the 10s poll picking up someone else's, say), whereas the cards
// a jump pushed aside never pair up - the card that took their slot came from
// further away. A whole-list shift (a new entry at the top pushing everything
// down by one) marks nobody - the new entry gets data-flip-enter instead and
// fades in.
// No rank-delta number on it: the list already carries two numbers per card.
export function useFlipReorder<T extends HTMLElement = HTMLDivElement>() {
  const containerRef = useRef<T | null>(null);
  const prevRef = useRef<Map<string, Pos>>(new Map());
  const timersRef = useRef<WeakMap<HTMLElement, ReturnType<typeof setTimeout>>>(new WeakMap());

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reduceMotion = typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const items = new Map<string, HTMLElement>();
    for (const child of Array.from(container.children) as HTMLElement[]) {
      const key = child.dataset.flipKey;
      if (key) items.set(key, child);
    }

    const next = new Map<string, Pos>();
    let index = 0;
    items.forEach((el, key) => {
      next.set(key, { top: el.offsetTop, left: el.offsetLeft, index: index++ });
    });

    const prev = prevRef.current;
    const firstPaint = prev.size === 0;

    const moved: { el: HTMLElement; dx: number; dy: number; delta: number; from: number; to: number }[] = [];
    items.forEach((el, key) => {
      const p = prev.get(key);
      const n = next.get(key)!;
      if (!p) {
        // Entering the list. Not on first paint - that is the whole list
        // arriving, not one card joining it.
        if (!firstPaint && !reduceMotion) {
          el.dataset.flipEnter = '';
          el.addEventListener('animationend', () => { delete el.dataset.flipEnter; }, { once: true });
        }
        return;
      }
      const dx = p.left - n.left;
      const dy = p.top - n.top;
      if (dx === 0 && dy === 0) return;
      // Positive = climbed the list (lower index).
      moved.push({ el, dx, dy, delta: p.index - n.index, from: p.index, to: n.index });
    });

    if (moved.length) {
      // "from -> to" per moved card, so a one-place move can look up whether the
      // card now in its old slot is the one that used to be in its new slot.
      const byFrom = new Map(moved.map((m) => [m.from, m]));
      const swapped = (m: typeof moved[number]) =>
        Math.abs(m.delta) === 1 && byFrom.get(m.to)?.to === m.from;
      for (const m of moved) {
        const isMover = Math.abs(m.delta) >= 2 || swapped(m);

        if (!reduceMotion) {
          m.el.style.transition = 'none';
          m.el.style.transform = `translate(${m.dx}px, ${m.dy}px)`;
        }
        if (isMover) {
          // Restart the linger if this card is still glowing from a previous
          // move: clear the attributes for a frame so the CSS animation
          // re-triggers instead of continuing from wherever it was.
          const pending = timersRef.current.get(m.el);
          if (pending) clearTimeout(pending);
          delete m.el.dataset.flipMove;
        }
        requestAnimationFrame(() => {
          if (!reduceMotion) {
            m.el.style.transition = `transform ${MOVE_MS}ms ${MOVE_EASING}`;
            m.el.style.transform = '';
          }
          if (isMover) {
            m.el.dataset.flipMove = m.delta > 0 ? 'up' : 'down';
            timersRef.current.set(m.el, setTimeout(() => {
              delete m.el.dataset.flipMove;
              timersRef.current.delete(m.el);
            }, LINGER_MS));
          }
        });
      }
    }

    prevRef.current = next;
  });

  return containerRef;
}
