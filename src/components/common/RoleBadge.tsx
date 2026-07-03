import type { Role } from '../../types/profile';
import { ROLE_COLORS } from '../../utils/roles';
import { useI18n } from '../../i18n/I18nContext';
import { Badge } from './Badge';

export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  const { t } = useI18n();
  return <Badge bgClass={ROLE_COLORS[role]} className={className}>{t.roles[role]}</Badge>;
}
