import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
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

function readParams(): { country: string | undefined; role: Role | undefined } {
  const p = new URLSearchParams(window.location.search);
  return {
    country: p.get('country') ?? undefined,
    role: (p.get('role') as Role) ?? undefined,
  };
}

function writeParams(country: string | undefined, role: Role | undefined) {
  const p = new URLSearchParams();
  if (country) p.set('country', country);
  if (role) p.set('role', role);
  const qs = p.toString();
  window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
}

export function FilterProvider({ children }: { children: ReactNode }) {
  const initial = readParams();
  const [country, setCountryState] = useState<string | undefined>(initial.country);
  const [role, setRoleState] = useState<Role | undefined>(initial.role);
  const [hoveredProfileCountry, setHoveredProfileCountry] = useState<string | undefined>();

  useEffect(() => {
    writeParams(country, role);
  }, [country, role]);

  const setCountry = useCallback((c: string | undefined) => setCountryState(c), []);
  const setRole = useCallback((r: Role | undefined) => setRoleState(r), []);

  return (
    <FilterContext.Provider value={{ country, role, hoveredProfileCountry, setCountry, setRole, setHoveredProfileCountry }}>
      {children}
    </FilterContext.Provider>
  );
}
