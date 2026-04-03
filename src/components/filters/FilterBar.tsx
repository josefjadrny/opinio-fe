import { CountryFilter } from './CountryFilter';
import { RoleFilter } from './RoleFilter';

interface FilterBarProps {
  onAddProfile: () => void;
}

export function FilterBar({ onAddProfile }: FilterBarProps) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2 bg-surface border-b border-border">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-bold text-accent tracking-tight mr-2">PULSE</h1>
        <CountryFilter />
        <RoleFilter />
      </div>
      <button
        onClick={onAddProfile}
        className="bg-accent text-white text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-accent/80 transition-colors"
      >
        + Add Profile
      </button>
    </div>
  );
}
