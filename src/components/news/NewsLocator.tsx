import { useEffect, useMemo, useState } from 'react';
import { geoNaturalEarth1, geoPath, geoBounds } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import { numericToAlpha2 } from '../../utils/countries';
import { NO_DATA_FILL } from '../map/mapShared';

const GEO_URL = '/topojson/world-110m.json';
const W = 320;
const H = 200;

// A small static map around the story's country, so the news page keeps the
// geography the world map gives every other page. Same map file as the world
// map (cached by the service worker), cropped to the region, the country in
// the brand red with a slow pulse. A state too small for the 110m map (Malta,
// Singapore) has no shape and the card shows no map.
export function NewsLocator({ code }: { code: string }) {
  const [features, setFeatures] = useState<GeoJSON.Feature[]>([]);
  useEffect(() => {
    let live = true;
    fetch(GEO_URL)
      .then((r) => r.json())
      .then((topology: Topology) => {
        if (!live) return;
        const col = topology.objects.countries as GeometryCollection;
        setFeatures((feature(topology, col) as GeoJSON.FeatureCollection).features);
      })
      .catch(() => {});
    return () => { live = false; };
  }, []);

  const view = useMemo(() => {
    const target = features.find((f) => numericToAlpha2(String(f.id)) === code);
    if (!target) return null;
    // The country's box widened so its neighbours show; a small country gets
    // at least ~40 degrees of context.
    const [[x0, y0], [x1, y1]] = geoBounds(target);
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const span = Math.max(40, (x1 - x0) * 2.4, (y1 - y0) * 3.2);
    const box: GeoJSON.Feature = {
      type: 'Feature', properties: {},
      geometry: { type: 'MultiPoint', coordinates: [[cx - span / 2, Math.max(-85, cy - span / 3)], [cx + span / 2, Math.min(85, cy + span / 3)]] },
    };
    const projection = geoNaturalEarth1().fitExtent([[8, 8], [W - 8, H - 8]], box);
    const path = geoPath(projection);
    return { target, path };
  }, [features, code]);

  if (!view) return null;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full h-auto bg-black/20" aria-hidden="true">
      {features.filter((f) => f !== view.target).map((f, i) => (
        <path key={i} d={view.path(f) ?? ''} fill={NO_DATA_FILL} stroke="#e2e8ff" strokeOpacity={0.25} strokeWidth={0.5} />
      ))}
      <path className="news-locator-glow" d={view.path(view.target) ?? ''} fill="none" stroke="var(--color-accent)" strokeWidth={6} strokeLinejoin="round" />
      <path d={view.path(view.target) ?? ''} fill="var(--color-accent)" fillOpacity={0.85} stroke="#fff" strokeOpacity={0.9} strokeWidth={1.2} strokeLinejoin="round" />
    </svg>
  );
}
