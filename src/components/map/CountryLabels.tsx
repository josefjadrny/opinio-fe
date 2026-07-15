import { useMemo } from 'react';
import { buildCountryLabelLayout, type CountryAnchor } from './mapShared';
import type { Locale } from '../../i18n/strings';

interface CountryLabelsProps {
  anchors: CountryAnchor[];
  scale: number;
  labelScale: number;
  locale: Locale;
}

// Quiet country-name layer, shared by the desktop and mobile maps. Rendered
// beneath the city layer and non-interactive so hover/click still falls through
// to the country paths. Names are muted uppercase with a soft dark halo; sizes
// divide by scale to stay constant on-screen. Which names show is decided by the
// fit-gate in buildCountryLabelLayout (progressive reveal on zoom).
export function CountryLabels({ anchors, scale, labelScale, locale }: CountryLabelsProps) {
  const layout = useMemo(
    () => buildCountryLabelLayout(anchors, scale, labelScale, locale),
    [anchors, scale, labelScale, locale],
  );
  return (
    <g
      style={{ pointerEvents: 'none' }}
      fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    >
      {[...layout.entries()].map(([code, l]) => (
        <text
          key={code}
          x={l.x}
          y={l.y}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={l.fontSize}
          fontWeight={600}
          fill="#cfd4e6"
          fillOpacity={0.5}
          stroke="#14142a"
          strokeOpacity={0.5}
          strokeWidth={(1.1 / scale) * labelScale}
          paintOrder="stroke"
          style={{ textTransform: 'uppercase' }}
        >
          {l.name.toUpperCase()}
        </text>
      ))}
    </g>
  );
}
