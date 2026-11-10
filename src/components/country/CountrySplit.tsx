import type { CountryPollItem } from '../../types/api';
import { useI18n } from '../../i18n/I18nContext';
import { plural } from '../../i18n/pollStrings';
import { formatNumber } from '../../utils/formatNumber';
import { countryRows } from '../../utils/split';
import { OptionMark, TiedMarks } from '../poll/OptionAvatar';

// How one country answered one poll, for any number of answers: the winning
// answer and its share on top (a tie names no winner - the tied answers' marks
// and "tie"), then the poll detail's votes-tile line under it - a thin bar
// split by every answer in its colour, and the votes it stands on. The country
// page wraps the bar line in a StatTip that spells the split out (SplitList);
// the map hover, which cannot be interacted with, shows it as it is.
export function CountrySplit({ item, bar }: { item: CountryPollItem; bar?: (line: React.ReactNode) => React.ReactNode }) {
  const { p, locale } = useI18n();
  const total = item.country.total;
  const leading = item.country.leading;
  if (total === 0 || !leading) return null;
  const rows = countryRows(item).filter((r) => r.n > 0);
  const top = Math.max(...rows.map((r) => r.n));
  const tied = item.poll.options.filter((o) => rows.some((r) => r.id === o.id && r.n === top));
  const lead = item.poll.options.find((o) => o.id === leading.optionId);

  const line = (
    <span className="flex items-center gap-2.5 min-w-0">
      <span aria-hidden className="flex-1 min-w-0 flex h-1.5 gap-[2px] rounded-full overflow-hidden bg-white/5">
        {rows.map((r) => <span key={r.id} style={{ width: `${(r.n / total) * 100}%`, background: r.color }} />)}
      </span>
      <span className="shrink-0 text-[13px] text-white/60 tabular-nums">{plural(p.votes, locale, total, formatNumber)}</span>
    </span>
  );

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 min-w-0 text-[13px]">
        {leading.tie || !lead ? <TiedMarks options={tied} /> : <OptionMark color={lead.color} imageUrl={lead.imageUrl} className="w-5 h-5" />}
        <span className="truncate text-white/90">{leading.tie ? p.tie : leading.text}</span>
        {!leading.tie && <span className="shrink-0 tabular-nums font-semibold text-white">{leading.pct}%</span>}
      </div>
      {bar ? bar(line) : line}
    </div>
  );
}
