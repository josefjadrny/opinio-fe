import { useMemo } from 'react';
import { tiePatterns } from './mapShared';

// One stripe in map units at zoom 1 (~10px on a Full HD map). Wide on purpose:
// thin bands of two full-strength colours flickered like a candy cane over
// Russia-sized countries (the user's call). The pattern counter-scales with the
// zoom so the stripes keep their on-screen width instead of widening as you zoom in.
const STRIPE = 7.5;

export function TiePatterns({ fills, scale }: { fills: Map<string, string>; scale: number }) {
  const patterns = useMemo(() => tiePatterns(fills.values()), [fills]);
  if (patterns.length === 0) return null;
  const w = STRIPE / scale;
  return (
    <defs>
      {patterns.map(({ id, colors }) => (
        <pattern
          key={id}
          id={id}
          patternUnits="userSpaceOnUse"
          width={w * colors.length}
          height={w * colors.length}
          patternTransform="rotate(45)"
        >
          {colors.map((c, i) => (
            <rect key={c} x={i * w} y={0} width={w} height={w * colors.length} fill={c} />
          ))}
        </pattern>
      ))}
    </defs>
  );
}
