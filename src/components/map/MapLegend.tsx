import type { Profile } from '../../types/profile';
import { useI18n } from '../../i18n/I18nContext';
import { ACTIVITY_BANDS, ACTIVITY_RAMP, NO_DATA_FILL } from './mapShared';

// Colour key for the map. Home: votes in the last 24h - 0, then the four
// bands with their counts.
// A poll: one swatch per answer (a country takes its winner's colour).
export function MapLegend({ poll }: { poll?: Profile | null }) {
  const { p } = useI18n();
  return (
    <div className="absolute bottom-4 left-4 z-10 pointer-events-none select-none flex flex-col gap-2 rounded-xl bg-surface/80 backdrop-blur-sm ring-1 ring-border px-3 py-2.5 w-48 md:px-3.5 md:py-3 md:w-56">
      {poll ? (
        <div className="flex flex-col gap-1.5">
          {poll.options.map((o) => (
            <div key={o.id} className="flex items-center gap-2 text-[13px] leading-tight text-white/75">
              <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: o.color }} />
              <span className="truncate">{o.text}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 text-[13px] leading-tight text-white/55">
            <span className="w-3 h-3 rounded-sm shrink-0 ring-1 ring-white/10" style={{ background: NO_DATA_FILL }} />
            <span>{p.mapNobody}</span>
          </div>
        </div>
      ) : (
        <>
          <p className="text-[12px] font-medium leading-tight text-white/80">{p.mapLegendTitle}</p>
          {/* 0 = NO_DATA_FILL, then the four bands. */}
          <div className="flex h-3.5 gap-0.5">
            {[NO_DATA_FILL, ...ACTIVITY_RAMP].map((c, i) => (
              <span key={i} className="flex-1 first:rounded-l-full last:rounded-r-full" style={{ background: c }} />
            ))}
          </div>
          <div translate="no" className="flex text-[12px] leading-none text-white/60 tabular-nums notranslate">
            <span className="flex-1 text-center">0</span>
            {ACTIVITY_BANDS.map((lo, i) => (
              <span key={lo} className="flex-1 text-center">
                {i + 1 < ACTIVITY_BANDS.length ? `${lo}-${ACTIVITY_BANDS[i + 1] - 1}` : `${lo - 1}+`}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
