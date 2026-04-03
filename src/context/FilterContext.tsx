import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Role } from '../types/profile';

interface FilterState {
  country: string | undefined;
  role: Role | undefined;
  setCountry: (c: string | undefined) => void;
  setRole: (r: Role | undefined) => void;
}

const FilterContext = createContext<FilterState | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [country, setCountry] = useState<string | undefined>();
  const [role, setRole] = useState<Role | undefined>();

  return (
    <FilterContext.Provider value={{ country, role, setCountry, setRole }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilters must be used within FilterProvider');
  return ctx;
}
