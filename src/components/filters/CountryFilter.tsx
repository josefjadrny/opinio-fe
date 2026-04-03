import { ALL_COUNTRIES } from '../../utils/countries';
import { useFilters } from '../../context/FilterContext';

export function CountryFilter() {
  const { country, setCountry } = useFilters();

  return (
    <select
      value={country ?? ''}
      onChange={(e) => setCountry(e.target.value || undefined)}
      className="bg-surface-light text-text-primary text-sm rounded-lg border border-border px-3 py-1.5 focus:outline-none focus:border-accent"
    >
      <option value="">All Countries</option>
      {ALL_COUNTRIES.map((c) => (
        <option key={c.code} value={c.code}>{c.name}</option>
      ))}
    </select>
  );
}
