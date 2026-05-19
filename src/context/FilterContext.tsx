import { createContext, useState, useCallback, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Role } from '../types/profile';

export interface FilterState {
  country: string | undefined;
  roles: Role[];
  search: string;
  hoveredProfileCountry: string | undefined;
  setCountry: (c: string | undefined) => void;
  setRoles: (r: Role[]) => void;
  toggleRole: (r: Role) => void;
  setSearch: (q: string) => void;
  clearFilters: () => void;
  setHoveredProfileCountry: (c: string | undefined) => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const FilterContext = createContext<FilterState | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [hoveredProfileCountry, setHoveredProfileCountry] = useState<string | undefined>();

  const country = searchParams.get('country') ?? undefined;
  const rolesParam = searchParams.get('roles');
  const roles = rolesParam ? (rolesParam.split(',').filter(Boolean) as Role[]) : [];
  const search = searchParams.get('q') ?? '';

  const setCountry = useCallback((c: string | undefined) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (c) next.set('country', c); else next.delete('country');
      return next;
    });
  }, [setSearchParams]);

  const setRoles = useCallback((r: Role[]) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (r.length > 0) next.set('roles', r.join(',')); else next.delete('roles');
      return next;
    });
  }, [setSearchParams]);

  const toggleRole = useCallback((r: Role) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      const current = (next.get('roles') ?? '').split(',').filter(Boolean) as Role[];
      const updated = current.includes(r)
        ? current.filter(x => x !== r)
        : [...current, r];
      if (updated.length > 0) next.set('roles', updated.join(',')); else next.delete('roles');
      return next;
    });
  }, [setSearchParams]);

  // Search is debounced upstream (useSearchField) — by the time it reaches
  // here the value has settled. Written with replace:true so typing doesn't
  // pile up browser-history entries. < 3 chars clears the param.
  const setSearch = useCallback((q: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      const trimmed = q.trim();
      if (trimmed.length >= 3) next.set('q', trimmed); else next.delete('q');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const clearFilters = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('country');
      next.delete('roles');
      next.delete('q');
      return next;
    });
  }, [setSearchParams]);

  return (
    <FilterContext.Provider value={{ country, roles, search, hoveredProfileCountry, setCountry, setRoles, toggleRole, setSearch, clearFilters, setHoveredProfileCountry }}>
      {children}
    </FilterContext.Provider>
  );
}
