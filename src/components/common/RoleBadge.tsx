import type { Role } from '../../types/profile';
import { ROLE_LABELS, ROLE_COLORS } from '../../utils/roles';

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span className={`${ROLE_COLORS[role]} text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wide`}>
      {ROLE_LABELS[role]}
    </span>
  );
}
