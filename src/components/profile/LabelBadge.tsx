import { useI18n } from '../../i18n/I18nContext';
import { Badge } from '../common/Badge';

export type ProfileLabel = 'new' | 'rising' | 'falling';

const STYLES: Record<ProfileLabel, { bg: string; key: 'newBadge' | 'trending' | 'falling' }> = {
  new:     { bg: 'bg-orange-500', key: 'newBadge' },
  rising:  { bg: 'bg-positive',   key: 'trending' },
  falling: { bg: 'bg-accent',     key: 'falling' },
};

export function LabelBadge({ label }: { label: ProfileLabel }) {
  const { t } = useI18n();
  const s = STYLES[label];
  return <Badge bgClass={s.bg} variant="pulse">{t[s.key]}</Badge>;
}
