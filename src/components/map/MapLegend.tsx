import { useI18n } from '../../i18n/I18nContext';

// Colour key for the country tint (see colorForCountry in WorldMap). The map
// uses three tiers each side — the more a country's likes/dislikes outweigh the
// other, the brighter the tint — plus a neutral base for near-ties. Show that as
// a diverging ramp: strong dislike (red) -> neutral -> strong like (green).
const RAMP = ['#763852', '#5e2e44', '#4a2c38', '#3a3a6a', '#2c4a38', '#2e6042', '#36784f'];

export function MapLegend() {
  const { t } = useI18n();
  return (
    <div className="absolute bottom-4 left-4 z-10 pointer-events-none select-none flex flex-col gap-2 rounded-xl bg-surface/80 backdrop-blur-sm ring-1 ring-border px-3.5 py-3 w-56">
      <div className="flex h-3.5 overflow-hidden rounded-full">
        {RAMP.map((c, i) => (
          <span key={i} className="flex-1" style={{ background: c }} />
        ))}
      </div>
      <div className="flex justify-between text-[13px] leading-none text-white/60">
        <span>{t.mapLegendDisliked}</span>
        <span>{t.mapLegendNeutral}</span>
        <span>{t.mapLegendLiked}</span>
      </div>
    </div>
  );
}
