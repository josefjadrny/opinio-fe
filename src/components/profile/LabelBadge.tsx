import { useI18n } from '../../i18n/I18nContext';
import { Badge } from '../common/Badge';

export type ProfileLabel = 'new' | 'rising' | 'falling';

export function LabelBadge({ label }: { label: ProfileLabel }) {
  const { t } = useI18n();

  if (label === 'new') {
    return <Badge bgClass="bg-orange-500" variant="pulse">{t.newBadge}</Badge>;
  }

  const title = label === 'rising' ? t.trending : t.falling;
  const src = label === 'rising' ? '/icons/pepper-rising.png' : '/icons/pepper-falling.png';
  return <img src={src} alt={title} title={title} className="h-4 w-auto inline-block" />;
}
