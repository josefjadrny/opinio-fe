import { useEffect } from 'react';

// Marks the page noindex while `active`, restoring the static robots line
// from index.html afterwards. Used by news stories: a story is a short summary
// of someone else's article, and we keep those out of the index until an
// opinio about the story gives the page content of its own.
export function useNoindex(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const meta = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!meta) return;
    const previous = meta.content;
    meta.content = 'noindex, follow';
    return () => { meta.content = previous; };
  }, [active]);
}
