import { useQuery } from '@tanstack/react-query';
import { getSearchSuggest } from '../api/client';

// Minimum characters before the whisperer fires a suggest request. Matches the
// backend floor AND the feed's ?q= floor (3), so the "search all opinios" action
// is never a dead click — below 3 chars the endpoint returns empty groups anyway.
export const SUGGEST_MIN_CHARS = 3;

/**
 * Typeahead suggestions (users + opinios) for the search box. `query` should
 * already be debounced by the caller; the query only runs once it has at least
 * SUGGEST_MIN_CHARS. Keyed on (query, lang) so switching language refetches
 * translated opinio text. Country suggestions are matched client-side and are
 * NOT part of this payload.
 */
export function useSearchSuggest(query: string, lang?: string) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: ['search-suggest', trimmed.toLowerCase(), lang ?? ''],
    queryFn: () => getSearchSuggest(trimmed, lang),
    enabled: trimmed.length >= SUGGEST_MIN_CHARS,
    staleTime: 15_000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  });
}
