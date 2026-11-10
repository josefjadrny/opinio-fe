import { formatNumber } from '../../utils/formatNumber';
import { rankSplit, splitPct, type SplitRow } from '../../utils/split';

// A result spelled out for a StatTip panel: every answer biggest first, with
// its colour, votes and share. The poll detail's votes tile and the country
// page's cards open this same list.
export function SplitList({ rows, total }: { rows: SplitRow[]; total: number }) {
  return (
    <ul className="space-y-1.5">
      {rankSplit(rows).map((x) => (
        <li key={x.id} className="flex items-center gap-2 text-sm">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: x.color }} aria-hidden />
          <span className="flex-1 min-w-0 truncate text-white/80">{x.text}</span>
          <span className="shrink-0 tabular-nums text-white font-semibold">{formatNumber(x.n)}</span>
          <span className="shrink-0 w-10 text-right tabular-nums text-white/60">{splitPct(x.n, total)}</span>
        </li>
      ))}
    </ul>
  );
}
