import { ALL_ROLES, ROLE_LABELS } from '../../utils/roles';
import { useFilters } from '../../context/FilterContext';

export function RoleFilter() {
  const { role, setRole } = useFilters();

  return (
    <select
      value={role ?? ''}
      onChange={(e) => setRole((e.target.value || undefined) as typeof role)}
      className="bg-surface-light text-text-primary text-sm rounded-lg border border-border px-3 py-1.5 focus:outline-none focus:border-accent"
    >
      <option value="">All Roles</option>
      {ALL_ROLES.map((r) => (
        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
      ))}
    </select>
  );
}
