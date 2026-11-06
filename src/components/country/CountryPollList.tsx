import { useState } from 'react';
import type { CountryPollItem, PollLeading } from '../../types/api';
import { useCountryPolls } from '../../hooks/useCountryPolls';
import { useI18n } from '../../i18n/I18nContext';
import { plural } from '../../i18n/pollStrings';
import { formatNumber } from '../../utils/formatNumber';
import { FlagImg } from '../common/CountryFlag';
import { PollThumb } from '../poll/PollThumb';

function Answer({ item, leading, label, flag }: { item: CountryPollItem; leading: PollLeading; label: string; flag?: string }) {
  const { p } = useI18n();
  if (!leading) return null;
  const color = item.poll.options.find((o) => o.id === leading.optionId)?.color ?? '#8e94ad';
  return (
    <span className="flex items-center gap-1.5 min-w-0 text-[13px]">
      {flag ? <FlagImg code={flag} className="shrink-0" /> : (
        <svg className="w-4 h-4 shrink-0 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 010 18M12 3a15 15 0 000 18M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      <span className="sr-only">{label}: </span>
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: leading.tie ? '#8e94ad' : color }} />
      <span className="truncate text-white/85">{leading.tie ? p.tie : leading.text}</span>
      {!leading.tie && <span className="shrink-0 tabular-nums font-semibold text-white">{leading.pct}%</span>}
    </span>
  );
}

// "What {country} answers": the polls people from this country voted on, each
// with the country's leading answer next to the world's. That contrast is the
// page's evergreen content (POLLS-DESIGN.md section 8 "Country page").
export function CountryPollList({ code, countryName, onOpen }: { code: string; countryName: string; onOpen: (id: string) => void }) {
  const { p, locale } = useI18n();
  const [sort, setSort] = useState<'top' | 'recent'>('top');
  const { data, isLoading } = useCountryPolls(code, sort, 20);
  const items = data?.items ?? [];

  return (
    <div>
      <div className="flex items-center gap-1 mb-2" role="tablist">
        {(['top', 'recent'] as const).map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={sort === s}
            onClick={() => setSort(s)}
            className={`rounded-md px-2 py-1 text-xs font-bold uppercase tracking-wider transition-colors ${
              sort === s ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            {s === 'top' ? p.tabTop : p.tabRecent}
          </button>
        ))}
      </div>
      {isLoading && items.length === 0 ? (
        <p className="text-sm text-white/50 py-4 text-center">...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-white/50 py-4 text-center">{p.countryNoPolls.replace('{country}', countryName)}</p>
      ) : (
        <div className="space-y-1.5">
          {items.map((it) => (
            <div
              key={it.poll.id}
              role="link"
              tabIndex={0}
              onClick={() => onOpen(it.poll.id)}
              onKeyDown={(e) => { if (e.key === 'Enter') onOpen(it.poll.id); }}
              className="flex items-start gap-3 rounded-xl bg-surface-light/40 ring-1 ring-white/[0.06] hover:ring-white/15 px-3 py-2.5 cursor-pointer transition-all"
            >
              <PollThumb role={it.poll.role} imageUrl={it.poll.imageUrl} className="w-9 h-9" />
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-white leading-snug line-clamp-2">{it.poll.name}</p>
                <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5">
                  <Answer item={it} leading={it.country.leading} label={countryName} flag={code} />
                  <Answer item={it} leading={it.world.leading} label={p.world} />
                </div>
                <p className="mt-0.5 text-[12px] text-text-secondary tabular-nums">
                  {plural(p.votes, locale, it.country.total, formatNumber)} · {p.world}: {formatNumber(it.world.total)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
