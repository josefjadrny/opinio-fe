import { useLayoutEffect, useRef, useState } from 'react';
import type { CountryProfilesResponse } from '../../types/api';
import { getCountryName, getCountryFlag } from '../../utils/countries';
import { useI18n } from '../../i18n/I18nContext';
import { ProfileCard } from '../profile/ProfileCard';

interface CountryTooltipProps {
  countryCode: string;
  data: CountryProfilesResponse | undefined;
  isLoading: boolean;
  position: { x: number; y: number };
}

const TOOLTIP_WIDTH = 380;
const TOOLTIP_MAX_HEIGHT = 520;
const PADDING = 12;

export function CountryTooltip({ countryCode, data, isLoading, position }: CountryTooltipProps) {
  const { t } = useI18n();
  const tipRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    const tip = tipRef.current;
    if (!tip) return;
    const w = tip.offsetWidth;
    const h = tip.offsetHeight;

    let left = position.x + PADDING;
    let top = position.y + PADDING;

    if (left + w > window.innerWidth - PADDING) {
      left = position.x - w - PADDING;
    }
    if (top + h > window.innerHeight - PADDING) {
      top = position.y - h - PADDING;
    }

    left = Math.max(PADDING, Math.min(left, window.innerWidth - w - PADDING));
    top = Math.max(PADDING, Math.min(top, window.innerHeight - h - PADDING));

    setCoords({ left, top });
  }, [position.x, position.y, data, isLoading]);

  return (
    <div
      ref={tipRef}
      className="fixed z-50 bg-surface-light border border-border rounded-xl shadow-2xl p-3 pointer-events-none"
      style={{
        left: coords?.left ?? position.x + PADDING,
        top: coords?.top ?? position.y + PADDING,
        width: TOOLTIP_WIDTH,
        maxHeight: TOOLTIP_MAX_HEIGHT,
        overflow: 'auto',
        visibility: coords ? 'visible' : 'hidden',
      }}
    >
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
        <span className="text-lg">{getCountryFlag(countryCode)}</span>
        <span className="font-bold text-white">{getCountryName(countryCode)}</span>
      </div>

      {isLoading && (
        <div className="text-center text-text-secondary text-sm py-4">{t.loading}</div>
      )}

      {data && (
        <>
          {data.positive.length > 0 && (
            <div className="mb-3">
              <h3 className="text-xs font-bold text-positive uppercase mb-1.5">{t.trending}</h3>
              <div className="space-y-1">
                {data.positive.map((p) => (
                  <ProfileCard key={p.id} profile={p} variant="tooltip" />
                ))}
              </div>
            </div>
          )}

          {data.negative.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-negative uppercase mb-1.5">{t.falling}</h3>
              <div className="space-y-1">
                {data.negative.map((p) => (
                  <ProfileCard key={p.id} profile={p} variant="tooltip" />
                ))}
              </div>
            </div>
          )}

          {data.positive.length === 0 && data.negative.length === 0 && (
            <p className="text-center text-text-secondary text-sm py-4">{t.noProfiles}</p>
          )}
        </>
      )}
    </div>
  );
}
