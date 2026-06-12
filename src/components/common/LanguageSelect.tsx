import { useState, useRef, useEffect } from 'react';
import { LANGUAGES, type Locale } from '../../i18n/strings';
import { FlagImg } from './CountryFlag';

// Custom dropdown (not a native <select>) so each language can show a real
// flag image. Native <option> elements can only hold text, and the emoji
// flags we used before render as blank/letter-pairs on Windows — <FlagImg>
// falls back to the flag-icons sprite there.
export function LanguageSelect({
  value,
  onChange,
}: {
  value: Locale;
  onChange: (locale: Locale) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOut(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onOut);
    return () => document.removeEventListener('mousedown', onOut);
  }, [open]);

  const current = LANGUAGES[value];
  const entries = Object.entries(LANGUAGES) as [Locale, (typeof LANGUAGES)[Locale]][];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 w-full text-white text-sm rounded-lg border border-border pl-3 pr-9 py-2 focus:outline-none focus:border-accent relative"
        style={{ backgroundColor: '#1a1a2e' }}
      >
        <FlagImg code={current.flag} className="shrink-0 inline-block align-middle" />
        <span className="truncate flex-1 text-left">{current.name}</span>
        <svg
          className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-surface border border-border rounded-xl shadow-2xl py-1 max-h-64 overflow-y-auto">
          {entries.map(([key, lang]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                onChange(key);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 transition-colors hover:bg-white/5 ${
                key === value ? 'text-accent' : 'text-white/80'
              }`}
            >
              <FlagImg code={lang.flag} className="shrink-0 inline-block align-middle" />
              <span className="truncate">{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
