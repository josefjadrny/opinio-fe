import { useState, useEffect, useRef } from 'react';
import { useFilters } from '../context/useFilters';

// Search is an advanced, comparatively slow filter (full-text query) — a long
// debounce keeps it from firing mid-word. Each search ends up as one DB hit.
const DEBOUNCE_MS = 700;

/**
 * Input state for the profile search filter. `value` updates instantly for
 * responsive typing; the URL `?q=` is only written 700ms after the user stops
 * (values < 3 chars clear it). Shared by the desktop and mobile search inputs.
 */
export function useSearchField() {
  const { search, setSearch } = useFilters();
  const [value, setValue] = useState(search);

  // lastPushed — the URL value we last wrote, so the sync effect can tell our
  // own debounced write echoing back apart from a genuine external change.
  const lastPushed = useRef(search);
  // pending — the latest unsettled value, flushed if the input unmounts.
  const pending = useRef<string | null>(null);
  // setSearch is recreated whenever the URL changes; keep it in a ref so the
  // unmount-flush effect can stay []-deps (cleanup runs on unmount only).
  const setSearchRef = useRef(setSearch);
  setSearchRef.current = setSearch;

  // Adopt external URL changes (clear-filters button, browser back/forward) —
  // but ignore the echo of our own debounced write.
  useEffect(() => {
    if (search !== lastPushed.current) {
      lastPushed.current = search;
      setValue(search);
    }
  }, [search]);

  // Debounce the write to ?q= — 700ms after the user stops typing.
  useEffect(() => {
    const settled = value.trim();
    if (settled === search) { pending.current = null; return; }
    if (settled.length < 3 && search === '') { pending.current = null; return; }
    pending.current = value;
    const id = setTimeout(() => {
      pending.current = null;
      lastPushed.current = settled.length >= 3 ? settled : '';
      setSearch(value);
    }, DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [value, search, setSearch]);

  // Flush a still-pending value if the input unmounts (e.g. the mobile filter
  // sheet closes before the debounce fires) so the search isn't dropped.
  useEffect(() => {
    return () => {
      if (pending.current != null) setSearchRef.current(pending.current);
    };
  }, []);

  return { value, setValue };
}
