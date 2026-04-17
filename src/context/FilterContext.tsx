import { createContext, useState, useCallback, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Role } from '../types/profile';

export interface FilterState {
  country: string | undefined;
  role: Role | undefined;
  hoveredProfileCountry: string | undefined;
  setCountry: (c: string | undefined) => void;
  setRole: (r: Role | undefined) => void;
  setHoveredProfileCountry: (c: string | undefined) => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const FilterContext = createContext<FilterState | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [hoveredProfileCountry, setHoveredProfileCountry] = useState<string | undefined>();

  const country = searchParams.get('country') ?? undefined;
  const role = (searchParams.get('role') as Role) ?? undefined;

  const setCountry = useCallback((c: string | undefined) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (c) next.set('country', c); else next.delete('country');
      return next;
    });
  }, [setSearchParams]);

  const setRole = useCallback((r: Role | undefined) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (r) next.set('role', r); else next.delete('role');
      return next;
    });
  }, [setSearchParams]);

  return (
    <FilterContext.Provider value={{ country, role, hoveredProfileCountry, setCountry, setRole, setHoveredProfileCountry }}>
      {children}
    </FilterContext.Provider>
  );
}
