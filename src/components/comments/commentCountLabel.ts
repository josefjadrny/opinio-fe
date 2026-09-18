import type { Strings } from '../../i18n/strings';
import { formatNumber } from '../../utils/formatNumber';

// "{n} comments" by CLDR plural category. Intl.PluralRules knows each
// language's rule (Polish: 22-24 are "few", 12-14 are not; Czech: only 2-4),
// which a hand-written n <= 4 split gets wrong; "other" maps onto the "many"
// string, which is what every language here uses for the rest.
export function commentCountLabel(t: Strings, locale: string, n: number): string {
  const category = new Intl.PluralRules(locale).select(n);
  const key = category === 'one' ? t.commentsCountOne : category === 'few' ? t.commentsCountFew : t.commentsCountMany;
  return key.replace('{n}', formatNumber(n));
}
