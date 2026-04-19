import { useState, useRef, useEffect } from 'react';
import { ALL_COUNTRIES, getCountryFlag } from '../../utils/countries';
import { useFilters } from '../../context/useFilters';
import { useI18n } from '../../i18n/I18nContext';

export function CountryFilter() {
  const { country, setCountry } = useFilters();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = ALL_COUNTRIES.find(c => c.code === country);
  const filtered = query
    ? ALL_COUNTRIES.filter(c => c.name.toLowerCase().startsWith(query.toLowerCase()))
    : ALL_COUNTRIES;

  useEffect(() => {
    if (open) inputRef.current?.focus();
    else setQuery('');
  }, [open]);

  useEffect(() => {
    function onOut(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onOut);
    return () => document.removeEventListener('mousedown', onOut);
  }, [open]);

  const pick = (code: string | undefined) => {
    setCountry(code);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 bg-surface-light text-text-primary text-sm rounded-lg border border-border px-3 py-1.5 focus:outline-none focus:border-accent min-w-[9rem] max-w-[11rem]"
      >
        {selected ? (
          <>
            <span className="shrink-0">{getCountryFlag(selected.code)}</span>
            <span className="truncate flex-1 text-left">{selected.name}</span>
          </>
        ) : (
          <span className="flex-1 text-left text-text-primary/70">{t.allCountries}</span>
        )}
        <svg className={`w-3 h-3 shrink-0 text-white/40 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 bg-surface border border-border rounded-xl shadow-2xl w-52">
          <div className="px-2 pt-2 pb-1">
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Escape') setOpen(false); }}
              placeholder="Type to filter…"
              className="w-full bg-white/5 text-white text-sm rounded-lg px-2.5 py-1.5 focus:outline-none placeholder:text-white/30"
            />
          </div>

          <div className="overflow-y-auto max-h-56 py-1">
            {!query && (
              <button
                onClick={() => pick(undefined)}
                className={`w-full text-left px-3 py-1.5 text-sm transition-colors hover:bg-white/5 ${!country ? 'text-accent' : 'text-white/60'}`}
              >
                {t.allCountries}
              </button>
            )}
            {filtered.map(c => (
              <button
                key={c.code}
                onClick={() => pick(c.code)}
                className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 transition-colors hover:bg-white/5 ${country === c.code ? 'text-accent' : 'text-white/80'}`}
              >
                <span className="shrink-0">{getCountryFlag(c.code)}</span>
                <span className="truncate">{c.name}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-sm text-white/30 text-center">No matches</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
