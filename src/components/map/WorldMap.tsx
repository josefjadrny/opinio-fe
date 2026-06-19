import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import { useCountryProfiles } from '../../hooks/useCountryProfiles';
import { useCountries } from '../../hooks/useCountries';
import { numericToAlpha2 } from '../../utils/countries';
import { CITIES, cityLabel } from '../../utils/cities';
import { useI18n } from '../../i18n/I18nContext';
import { CountryTooltip } from './CountryTooltip';
import { useFilters } from '../../context/useFilters';

const GEO_URL = '/topojson/world-110m.json';
const WIDTH = 800;
const HEIGHT = 500;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4.5;
const DEFAULT_FILL = '#3a3a6a';
// City names fade in progressively as you zoom so labels never pile up: capitals
// first, then secondary cities deeper in (where there's room). Dots are always
// drawn. Tuned with the higher MAX_ZOOM so dense regions can be pulled apart.
// Thresholds kept high so a barely-zoomed map (esp. on wide Full HD layouts)
// doesn't dump the whole capital set at once.
const CAPITAL_LABEL_ZOOM = 2.0;
const CITY_LABEL_ZOOM = 2.8;

// City labels/dots are constant in SVG user units, so the map's CSS render width
// (viewBox is 800 wide) sets their on-screen size: a wide map shows them at a
// comfortable ~13 px, but a Full HD map (~870 px wide, squeezed between the two
// sidebars) renders them at ~7.6 px - too small to read. `labelScale` below
// compensates: at/above LABEL_REF_WIDTH it's 1 (wide screens unchanged), and
// it grows as the map narrows so labels stay readable, capped by MAX_LABEL_SCALE.
const LABEL_REF_WIDTH = 1430;
const MAX_LABEL_SCALE = 2.5;

// Tint a country by like/dislike skew. Pct = (max - min) / min — i.e. how much
// the leading side outweighs the trailing side. Sub-25% stays neutral so noisy
// near-ties don't flicker; tiers brighten with skew but stay dark on purpose.
function colorForCountry(likes: number, dislikes: number): string {
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

function clampTranslate(tx: number, ty: number, scale: number) {
  return {
    tx: Math.min(WIDTH * 0.1, Math.max(-(WIDTH * scale - WIDTH * 0.9), tx)),
    ty: Math.min(HEIGHT * 0.1, Math.max(-(HEIGHT * scale - HEIGHT * 0.9), ty)),
  };
}

// Scale slightly enlarged from default so far Pacific edges crop out, but with
// enough margin top/bottom that vertical centering reads as centered.
const projection = geoNaturalEarth1()
  .scale(170)
  .center([10, 20])
  .translate([400, 250]);

const pathGenerator = geoPath(projection);

interface ZoomState {
  scale: number;
  tx: number;
  ty: number;
}

export function WorldMap() {
  const navigate = useNavigate();
  const location = useLocation();
  const { locale } = useI18n();
  const { hoveredProfileCountry } = useFilters();
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [countries, setCountries] = useState<GeoJSON.Feature[]>([]);
  const [zoom, setZoom] = useState<ZoomState>({ scale: 1, tx: 0, ty: 0 });
  // Rendered CSS width of the map SVG, tracked so labels can be scaled up on
  // narrow (Full HD and smaller) layouts. Init to the reference width so the
  // first paint uses labelScale = 1 (no oversized flash) until the observer fires.
  const [mapRenderWidth, setMapRenderWidth] = useState(LABEL_REF_WIDTH);
  const labelScale = Math.min(MAX_LABEL_SCALE, Math.max(1, LABEL_REF_WIDTH / mapRenderWidth));
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [debouncedCountry, setDebouncedCountry] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; tx: number; ty: number } | null>(null);
  // Track whether the user actually dragged (>4px) so we can suppress the click-to-open
  // behavior after a pan and only treat real clicks as country navigations.
  const didDragRef = useRef(false);

  const { data, isLoading } = useCountryProfiles(debouncedCountry);
  const { data: countriesData } = useCountries();
  const countryColors = useMemo(() => {
    const map = new Map<string, string>();
    countriesData?.countries.forEach((c) => map.set(c.code, colorForCountry(c.likes, c.dislikes)));
    return map;
  }, [countriesData]);

  // Label placement + decluttering. Each label tries four positions around its
  // dot (right, left, above, below) and takes the first whose box is clear, so a
  // capital crowded on one side (e.g. Vienna next to Bratislava) flips to a free
  // side instead of overprinting. Capitals are placed first (priority) so they
  // win slots over secondary cities, but — unlike before — a capital with no
  // clear slot is DROPPED rather than force-shown: this stops a barely-zoomed map
  // from dumping all ~197 capitals into a dense wall. Crowded capitals reappear
  // as you zoom in and the cluster separates. Secondary cities then fill any
  // remaining gaps. Boxes are in projected (pre-transform) space; label sizes
  // divide by scale, so zooming in shrinks boxes and frees up positions. Returns
  // per-key {x, y, anchor} so the render places text identically. Recomputed each
  // zoom step.
  const cityLabelLayout = useMemo(() => {
    const scale = zoom.scale;
    type Box = { x1: number; y1: number; x2: number; y2: number };
    const placed: Box[] = [];
    const layout = new Map<string, { x: number; y: number; anchor: 'start' | 'end' | 'middle' }>();
    const overlapArea = (b: Box) =>
      placed.reduce((sum, o) => {
        const ox = Math.max(0, Math.min(b.x2, o.x2) - Math.max(b.x1, o.x1));
        const oy = Math.max(0, Math.min(b.y2, o.y2) - Math.max(b.y1, o.y1));
        return sum + ox * oy;
      }, 0);
    const projected = CITIES.map((c) => ({ c, p: projection(c.coords) })).filter(
      (x): x is { c: (typeof CITIES)[number]; p: [number, number] } => !!x.p,
    );
    // forceShow=true: render even when every position overlaps, taking the
    // least-crowded slot (reserved for nothing now — kept for the option).
    // forceShow=false: drop the label when no position is clear. Both capitals
    // and secondary cities use false so dense regions thin out; capitals just go
    // first, so they claim the open slots before cities do.
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
    // Capitals first (priority — they claim slots before cities), then secondary
    // cities fill gaps. Capitals are droppable now (forceShow=false) so crowded
    // regions don't overprint; they reappear as zoom separates the cluster.
    for (const { c, p } of projected) {
      if (c.capital && scale > CAPITAL_LABEL_ZOOM) place(c, p[0], p[1], false);
    }
    for (const { c, p } of projected) {
      if (!c.capital && scale > CITY_LABEL_ZOOM) place(c, p[0], p[1], false);
    }
    return layout;
  }, [zoom.scale, locale, labelScale]);

  // Track the map's rendered width so labelScale can normalize on-screen label
  // size across resolutions (the flex layout resizes the map independently of
  // the window, e.g. when sidebars reflow), not just on window resize.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setMapRenderWidth(w);
    });
    ro.observe(svg);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    fetch(GEO_URL)
      .then((r) => r.json())
      .then((topology: Topology) => {
        const col = topology.objects.countries as GeometryCollection;
        const { features } = feature(topology, col) as GeoJSON.FeatureCollection;
        setCountries(features);
      });
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const cx = ((e.clientX - rect.left) / rect.width) * WIDTH;
      const cy = ((e.clientY - rect.top) / rect.height) * HEIGHT;
      setZoom((prev) => {
        const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
        const newScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev.scale * factor));
        const ratio = newScale / prev.scale;
        const { tx, ty } = clampTranslate(
          cx - ratio * (cx - prev.tx),
          cy - ratio * (cy - prev.ty),
          newScale,
        );
        return { scale: newScale, tx, ty };
      });
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    dragRef.current = { startX: e.clientX, startY: e.clientY, tx: zoom.tx, ty: zoom.ty };
    didDragRef.current = false;
  }, [zoom.tx, zoom.ty]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });

    const drag = dragRef.current;
    if (drag) {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const scaleX = WIDTH / rect.width;
      const scaleY = HEIGHT / rect.height;
      const dx = (e.clientX - drag.startX) * scaleX;
      const dy = (e.clientY - drag.startY) * scaleY;
      if (Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) > 4) {
        didDragRef.current = true;
      }
      setZoom((prev) => {
        const { tx, ty } = clampTranslate(drag.tx + dx, drag.ty + dy, prev.scale);
        return { ...prev, tx, ty };
      });
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const handleCountryClick = useCallback((alpha2: string) => {
    if (didDragRef.current) return;
    navigate('/c/' + alpha2 + location.search);
  }, [navigate, location.search]);

  const handleMouseEnter = useCallback((alpha2: string) => {
    setHoveredCountry(alpha2);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedCountry(alpha2);
    }, 300);
  }, []);

  const handleMouseLeave = useCallback(() => {
    clearTimeout(debounceRef.current);
    setHoveredCountry(null);
    setDebouncedCountry(null);
  }, []);

  return (
    <div className="relative flex-1 min-h-0" onMouseMove={handleMouseMove}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible', userSelect: 'none', WebkitUserSelect: 'none' }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <g transform={`translate(${zoom.tx},${zoom.ty}) scale(${zoom.scale})`}>
          {countries.map((geo, i) => {
            const id = String((geo as GeoJSON.Feature & { id?: string | number }).id ?? '');
            const alpha2 = numericToAlpha2(id);
            const isHovered = !!alpha2 && (alpha2 === hoveredCountry || alpha2 === hoveredProfileCountry);
            const d = pathGenerator(geo);
            if (!d) return null;

            const baseFill = (alpha2 && countryColors.get(alpha2)) || DEFAULT_FILL;
            return (
              <path
                key={`${id}-${i}`}
                d={d}
                fill={isHovered ? '#e94560' : baseFill}
                stroke={isHovered ? '#f1f1f1' : '#5a5a8a'}
                strokeWidth={(isHovered ? 0.75 : 0.5) / zoom.scale}
                style={{ outline: 'none', cursor: alpha2 ? 'pointer' : 'default' }}
                onMouseEnter={() => alpha2 && handleMouseEnter(alpha2)}
                onMouseLeave={handleMouseLeave}
                onClick={() => alpha2 && handleCountryClick(alpha2)}
              />
            );
          })}

          {/* City markers. Non-interactive (pointerEvents none) so hover/click
              still falls through to the country path underneath. Marker + label
              sizes divide by zoom.scale to stay a constant on-screen size, like
              the country strokeWidth above. Muted fills + soft halo so the layer
              reads as a quiet reference, not a glossy overlay. Capitals are a
              touch larger and labelled earlier than secondary cities. */}
          <g
            style={{ pointerEvents: 'none' }}
            fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
          >
            {CITIES.map((city) => {
              const p = projection(city.coords);
              if (!p) return null;
              const [cx, cy] = p;
              const r = ((city.capital ? 0.95 : 0.65) / zoom.scale) * labelScale;
              const label = cityLabelLayout.get(`${city.code}:${city.name}`);
              return (
                <g key={`${city.code}:${city.name}`}>
                  {/* Dot stays muted (fillOpacity) so it reads quiet; the label
                      keeps full opacity + a dark halo so it stays legible. */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill={city.capital ? '#aab0c6' : '#8e94ad'}
                    fillOpacity={city.capital ? 0.85 : 0.6}
                  />
                  {label && (
                    <text
                      x={label.x}
                      y={label.y}
                      textAnchor={label.anchor}
                      dominantBaseline="central"
                      fontSize={((city.capital ? 7 : 6.2) / zoom.scale) * labelScale}
                      fontWeight={500}
                      fill="#e4e7f1"
                      stroke="#14142a"
                      strokeWidth={(1.4 / zoom.scale) * labelScale}
                      paintOrder="stroke"
                    >
                      {cityLabel(city.name, locale)}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </g>
      </svg>

      {hoveredCountry && (
        <CountryTooltip
          countryCode={hoveredCountry}
          data={data}
          isLoading={isLoading}
          position={mousePos}
        />
      )}
    </div>
  );
}
