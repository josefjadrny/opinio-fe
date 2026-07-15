import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import { useCountryProfiles } from '../../hooks/useCountryProfiles';
import { useCountries } from '../../hooks/useCountries';
import { numericToAlpha2 } from '../../utils/countries';
import { CITIES, cityLabel } from '../../utils/cities';
import { useI18n } from '../../i18n/I18nContext';
import { CountryTooltip } from './CountryTooltip';
import { MapZoomControl } from './MapZoomControl';
import { MapLegend } from './MapLegend';
import { useFilters } from '../../context/useFilters';
import {
  WIDTH,
  HEIGHT,
  MIN_ZOOM,
  MAX_ZOOM,
  DEFAULT_FILL,
  LABEL_REF_WIDTH,
  MAX_LABEL_SCALE,
  colorForCountry,
  clampTranslate,
  projection,
  pathGenerator,
  buildCityLabelLayout,
} from './mapShared';

const GEO_URL = '/topojson/world-110m.json';

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

  // Label placement + decluttering (see buildCityLabelLayout in mapShared).
  // Recomputed each zoom step / locale / labelScale change.
  const cityLabelLayout = useMemo(
    () => buildCityLabelLayout(zoom.scale, locale, labelScale),
    [zoom.scale, locale, labelScale],
  );

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

  // Zoom from the slider/buttons, keeping the map's visual center fixed — the
  // viewBox center (WIDTH/2, HEIGHT/2) maps to the screen center under xMidYMid,
  // so we reuse the wheel's anchor math with it. nextScaleFor reads the live
  // previous scale so rapid clicks compound instead of snapping to one step.
  const applyZoom = useCallback((nextScaleFor: (prevScale: number) => number) => {
    setZoom((prev) => {
      const ns = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextScaleFor(prev.scale)));
      const ratio = ns / prev.scale;
      const cx = WIDTH / 2;
      const cy = HEIGHT / 2;
      const { tx, ty } = clampTranslate(cx - ratio * (cx - prev.tx), cy - ratio * (cy - prev.ty), ns);
      return { scale: ns, tx, ty };
    });
  }, []);
  const zoomToScale = useCallback((s: number) => applyZoom(() => s), [applyZoom]);
  const stepZoom = useCallback((factor: number) => applyZoom((p) => p * factor), [applyZoom]);

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
    // A map click is the ONE place that applies the country filter to the feed:
    // set ?country= so the sidebars filter behind the modal and stay filtered on
    // close. Other ways into the detail (breakdown row, /c/ link, pasted URL)
    // navigate without it and leave the feed untouched.
    const params = new URLSearchParams(location.search);
    params.set('country', alpha2);
    navigate('/c/' + alpha2 + '?' + params.toString());
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
                fill={baseFill}
                stroke={isHovered ? '#f1f1f1' : '#5a5a8a'}
                strokeWidth={(isHovered ? 1.1 : 0.5) / zoom.scale}
                style={{
                  outline: 'none',
                  cursor: alpha2 ? 'pointer' : 'default',
                  // Keep the country's own sentiment colour on hover (red/green
                  // mean "unpopular/popular" in the legend, so don't repaint it);
                  // signal selection by brightening it + a thicker white border.
                  filter: isHovered ? 'brightness(1.7)' : undefined,
                }}
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

      <MapLegend />
      <MapZoomControl scale={zoom.scale} min={MIN_ZOOM} max={MAX_ZOOM} onZoom={zoomToScale} onStep={stepZoom} />

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
