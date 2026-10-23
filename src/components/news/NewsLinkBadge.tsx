import { useNavigate, useLocation } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nContext';
import { HoverTip } from '../common/HoverTip';
import { NewsIcon } from './NewsBits';

// The broadcast glyph on a list card whose opinio is about a news story,
// beside the comment count and as quiet as it: muted waves, only the dot
// keeps the news red. Opens the story; the card's own click (the opinio) is
// stopped so this navigation is the one that sticks. Nothing for an opinio
// without a story.
export function NewsLinkBadge({ newsId, size = 'sm' }: { newsId?: string | null; size?: 'sm' | 'xs' }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  if (!newsId) return null;
  return (
    <HoverTip label={t.newsOnTheNews}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); navigate('/n/' + newsId + location.search); }}
        aria-label={t.newsOnTheNews}
        className={`inline-flex items-center rounded-lg text-white/50 hover:text-white/80 transition-colors ${size === 'sm' ? 'px-2 py-0.5' : ''}`}
      >
        <NewsIcon className="w-5 h-5" fill />
      </button>
    </HoverTip>
  );
}
