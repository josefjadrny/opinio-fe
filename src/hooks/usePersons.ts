import { useQueries } from '@tanstack/react-query';
import { getPerson } from '../api/client';
import type { Person } from '../types/api';

// Well-known people by id, one query (and one URL) per person, so each is
// fetched and cached once wherever it appears. A person changes only when the
// data job edits them, hence the day-long staleTime. Undefined until every
// query has settled; an id that failed or does not exist is missing from the map.
export function usePersons(ids: number[]): Map<number, Person> | undefined {
  const unique = [...new Set(ids)];
  return useQueries({
    queries: unique.map((id) => ({
      queryKey: ['person', id],
      queryFn: () => getPerson(id),
      staleTime: 24 * 60 * 60_000,
      retry: 1,
    })),
    combine: (results) => {
      if (results.some((r) => r.isPending)) return undefined;
      return new Map(results.flatMap((r) => (r.data ? [[r.data.id, r.data] as const] : [])));
    },
  });
}
