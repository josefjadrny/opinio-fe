import { useLayoutEffect, useRef } from 'react';

// FLIP-style reorder animation. Wrap each direct child in <div data-flip-key={id}>
// inside the container ref returned here. When the container's children change
// position between renders, each moved child briefly translates from its old
// position and animates back to its new one.
export function useFlipReorder<T extends HTMLElement = HTMLDivElement>() {
  const containerRef = useRef<T | null>(null);
  const prevRef = useRef<Map<string, { top: number; left: number }>>(new Map());

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const items = new Map<string, HTMLElement>();
    for (const child of Array.from(container.children) as HTMLElement[]) {
      const key = child.dataset.flipKey;
      if (key) items.set(key, child);
    }

    const next = new Map<string, { top: number; left: number }>();
    items.forEach((el, key) => {
      next.set(key, { top: el.offsetTop, left: el.offsetLeft });
    });

    items.forEach((el, key) => {
      const prev = prevRef.current.get(key);
      if (!prev) return;
      const n = next.get(key)!;
      const dx = prev.left - n.left;
      const dy = prev.top - n.top;
      if (dx === 0 && dy === 0) return;
      el.style.transition = 'none';
      el.style.transform = `translate(${dx}px, ${dy}px)`;
      requestAnimationFrame(() => {
        el.style.transition = 'transform 1000ms cubic-bezier(0.2, 0.8, 0.2, 1)';
        el.style.transform = '';
      });
    });

    prevRef.current = next;
  });

  return containerRef;
}
