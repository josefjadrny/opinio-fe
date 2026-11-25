import type { OptionCountryRow } from '../../utils/optionCountries';
import type { PollOption } from '../../types/profile';
import { FlagImg } from '../common/CountryFlag';
import { getCountryName } from '../../utils/countries';
import { formatNumber } from '../../utils/formatNumber';
import { useI18n } from '../../i18n/I18nContext';
import { plural } from '../../i18n/pollStrings';
import { OptionMark } from './OptionAvatar';

const TOP = 5;

// What an answer's hover (desktop) or tap after voting (phone) opens: where
// its votes came from. The answer on top, then the countries that gave it the
// most votes - flag, name and how many votes it got there (one number: a share
// beside it read as a second, competing figure) - and a count of the rest.
export function OptionCountriesPanel({ option, text, rows }: { option: PollOption; text: string; rows: OptionCountryRow[] }) {
  const { locale, p } = useI18n();
  const shown = rows.slice(0, TOP);
  const rest = rows.length - shown.length;
  return (
    <div>
      <div className="flex items-center gap-2 pb-2 mb-2 border-b border-border">
        <OptionMark color={option.color} imageUrl={option.imageUrl} className="w-5 h-5" />
        <span className="flex-1 min-w-0 truncate text-sm font-semibold text-white">{text}</span>
      </div>
      <p className="text-xs text-white/50 mb-1.5">{p.optionTopCountries}</p>
      <ul className="space-y-1.5">
        {shown.map((c) => (
          <li key={c.code} className="flex items-center gap-2 text-sm">
            <FlagImg code={c.code} className="shrink-0" />
            <span className="flex-1 min-w-0 truncate text-white/80">{getCountryName(c.code, locale)}</span>
            <span className="shrink-0 text-right tabular-nums font-semibold text-white">{plural(p.votes, locale, c.n, formatNumber)}</span>
          </li>
        ))}
      </ul>
      {rest > 0 && <p className="mt-2 text-xs text-white/50">{plural(p.optionMoreCountries, locale, rest, formatNumber)}</p>}
    </div>
  );
}
