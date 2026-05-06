import { useI18n } from '../../i18n/I18nContext';
import { Badge } from '../common/Badge';

export function NewBadge() {
  const { t } = useI18n();
  return <Badge bgClass="bg-orange-500" variant="pulse">{t.newBadge}</Badge>;
}
