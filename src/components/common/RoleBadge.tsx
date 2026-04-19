import type { Role } from '../../types/profile';
import { ROLE_COLORS } from '../../utils/roles';
import { useI18n } from '../../i18n/I18nContext';
import { useFilters } from '../../context/useFilters';

export function RoleBadge({ role }: { role: Role }) {
  const { t } = useI18n();
  const { toggleRole } = useFilters();

  return (
    <span
      onClick={(e) => { e.stopPropagation(); toggleRole(role); }}
      className={`${ROLE_COLORS[role]} text-white text-[11px] leading-none font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wide cursor-pointer hover:opacity-80 transition-opacity`}
    >
      {t.roles[role]}
    </span>
  );
}
