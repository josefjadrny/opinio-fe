import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { CITIES, cityLabel } from '../../utils/cities';
import type { Locale } from '../../i18n/strings';

// Shared map geometry + styling used by both the desktop WorldMap and the mobile
// MobileMap so the projection, sentiment colours, and city-label decluttering
// stay identical across the two surfaces (only interaction differs).

export const WIDTH = 800;
export const HEIGHT = 500;
export const MIN_ZOOM = 1;
export const MAX_ZOOM = 5;
export const DEFAULT_FILL = '#3a3a6a';

// City names fade in progressively as you zoom so labels never pile up: capitals
// first, then secondary cities deeper in (where there's room). Dots are always
// drawn. Thresholds kept high so a barely-zoomed map doesn't dump the whole
// capital set at once.
export const CAPITAL_LABEL_ZOOM = 2.0;
export const CITY_LABEL_ZOOM = 2.8;

// City labels/dots are constant in SVG user units, so the map's CSS render width
// (viewBox is 800 wide) sets their on-screen size. `labelScale` compensates on
// narrow layouts: at/above LABEL_REF_WIDTH it's 1, and grows as the map narrows
// so labels stay readable, capped by MAX_LABEL_SCALE.
export const LABEL_REF_WIDTH = 1430;
export const MAX_LABEL_SCALE = 2.5;

// Tint a country by like/dislike skew. Pct = (max - min) / min — i.e. how much
// the leading side outweighs the trailing side. Sub-25% stays neutral so noisy
// near-ties don't flicker; tiers brighten with skew but stay dark on purpose.
export function colorForCountry(likes: number, dislikes: number): string {
  if (likes === dislikes) return DEFAULT_FILL;
  const hi = Math.max(likes, dislikes);
  const lo = Math.min(likes, dislikes);
  const pct = lo === 0 ? Infinity : (hi - lo) / lo;
  if (pct <= 0.25) return DEFAULT_FILL;
  const positive = likes > dislikes;
  if (pct <= 0.5) return positive ? '#2c4a38' : '#4a2c38';
  if (pct <= 1.0) return positive ? '#2e6042' : '#5e2e44';
  return positive ? '#36784f' : '#763852';
}

export function clampTranslate(tx: number, ty: number, scale: number) {
  return {
    tx: Math.min(WIDTH * 0.1, Math.max(-(WIDTH * scale - WIDTH * 0.9), tx)),
    ty: Math.min(HEIGHT * 0.1, Math.max(-(HEIGHT * scale - HEIGHT * 0.9), ty)),
  };
}

// Scale slightly enlarged from default so far Pacific edges crop out, but with
// enough margin top/bottom that vertical centering reads as centered.
export const projection = geoNaturalEarth1()
  .scale(170)
  .center([10, 20])
  .translate([400, 250]);

export const pathGenerator = geoPath(projection);

export type CityLabelLayout = Map<string, { x: number; y: number; anchor: 'start' | 'end' | 'middle' }>;

// Label placement + decluttering. Each label tries four positions around its dot
// (right, left, above, below) and takes the first whose box is clear, so a
// capital crowded on one side flips to a free side instead of overprinting.
// Capitals are placed first (priority) so they claim open slots before cities; a
// capital with no clear slot is DROPPED rather than force-shown so a barely-zoomed
// map doesn't dump all ~197 capitals into a dense wall. Boxes are in projected
// (pre-transform) space; label sizes divide by scale, so zooming in shrinks boxes
// and frees positions. Returns per-key {x, y, anchor} so the render places text
// identically. Recompute each zoom step.
// capitalsOnly skips secondary cities entirely (used by the mobile map, which
// shows only capitals to cut clutter + node count).
export function buildCityLabelLayout(
  scale: number,
  locale: Locale,
  labelScale: number,
  capitalsOnly = false,
): CityLabelLayout {
  type Box = { x1: number; y1: number; x2: number; y2: number };
  const placed: Box[] = [];
  const layout: CityLabelLayout = new Map();
  const overlapArea = (b: Box) =>
    placed.reduce((sum, o) => {
      const ox = Math.max(0, Math.min(b.x2, o.x2) - Math.max(b.x1, o.x1));
      const oy = Math.max(0, Math.min(b.y2, o.y2) - Math.max(b.y1, o.y1));
      return sum + ox * oy;
    }, 0);
  const projected = CITIES.map((c) => ({ c, p: projection(c.coords) })).filter(
    (x): x is { c: (typeof CITIES)[number]; p: [number, number] } => !!x.p,
  );
  const place = (c: (typeof CITIES)[number], cx: number, cy: number, forceShow: boolean) => {
    const fs = ((c.capital ? 7 : 6.2) / scale) * labelScale;
    const w = cityLabel(c.name, locale).length * fs * 0.55;
    const h = fs;
    const gap = (((c.capital ? 0.95 : 0.65) + 1.9) / scale) * labelScale;
    // [x, y (vertical center), anchor, box] candidates: right, left, above, below.
    const candidates: [number, number, 'start' | 'end' | 'middle', Box][] = [
      [cx + gap, cy, 'start', { x1: cx + gap, y1: cy - h / 2, x2: cx + gap + w, y2: cy + h / 2 }],
      [cx - gap, cy, 'end', { x1: cx - gap - w, y1: cy - h / 2, x2: cx - gap, y2: cy + h / 2 }],
      [cx, cy - gap - h / 2, 'middle', { x1: cx - w / 2, y1: cy - gap - h, x2: cx + w / 2, y2: cy - gap }],
      [cx, cy + gap + h / 2, 'middle', { x1: cx - w / 2, y1: cy + gap, x2: cx + w / 2, y2: cy + gap + h }],
    ];
    let chosen = candidates.find(([, , , b]) => overlapArea(b) === 0);
    if (!chosen) {
      if (!forceShow) return;
      chosen = candidates.reduce((best, cur) =>
        overlapArea(cur[3]) < overlapArea(best[3]) ? cur : best,
      );
    }
    placed.push(chosen[3]);
    layout.set(`${c.code}:${c.name}`, { x: chosen[0], y: chosen[1], anchor: chosen[2] });
  };
  for (const { c, p } of projected) {
    if (c.capital && scale > CAPITAL_LABEL_ZOOM) place(c, p[0], p[1], false);
  }
  if (!capitalsOnly) {
    for (const { c, p } of projected) {
      if (!c.capital && scale > CITY_LABEL_ZOOM) place(c, p[0], p[1], false);
    }
  }
  return layout;
}
