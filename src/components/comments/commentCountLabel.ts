import type { Strings } from '../../i18n/strings';
import { formatNumber } from '../../utils/formatNumber';

// "{n} comments" by plural category (one=1, few=2-4, many=5+), same split as
// the votes-per-hour unit on the About page.
export function commentCountLabel(t: Strings, n: number): string {
  const key = n === 1 ? t.commentsCountOne : n <= 4 ? t.commentsCountFew : t.commentsCountMany;
  return key.replace('{n}', formatNumber(n));
}
