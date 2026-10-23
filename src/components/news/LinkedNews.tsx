import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nContext';
import { useMe } from '../../hooks/useMe';
import { useNewsItem } from '../../hooks/useNewsList';
import { useRemoveProfileNews } from '../../hooks/useRemoveProfileNews';
import { formatRelativeTime } from '../../utils/formatRelativeTime';
import { ConfirmModal } from '../common/ConfirmModal';
import { HoverTip } from '../common/HoverTip';
import type { Profile } from '../../types/profile';
import { NewsIcon, NewsPicture, NewsPill } from './NewsBits';

// The story an opinio is about, in its detail (desktop window and mobile
// sheet): the news card's anatomy at row size - picture, NEWS pill, source and
// time, the title. The whole row opens the story. The reporter gets an X that
// takes the link off for good (the API never links that opinio again), behind
// the usual confirm. Nothing renders until the story has loaded, and nothing
// at all for an opinio without one.
export function LinkedNews({ profile }: { profile: Profile }) {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: me } = useMe();
  const { data: news } = useNewsItem(profile.newsId ?? null);
  const remove = useRemoveProfileNews();
  const [confirming, setConfirming] = useState(false);
  if (!profile.newsId || !news) return null;
  const isAuthor = !!me?.user?.id && me.user.id === profile.addedById;

  return (
    <div className="group relative flex items-center gap-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] ring-1 ring-white/[0.08] hover:ring-white/15 pl-2.5 pr-2 py-2 transition-colors">
      <button
        type="button"
        onClick={() => navigate('/n/' + news.id + location.search)}
        aria-label={`${t.newsOnTheNews}: ${news.title}`}
        className="flex items-center gap-3 min-w-0 flex-1 text-left"
      >
        <NewsPicture news={news} className="w-10 h-10 shrink-0 ring-2 ring-white/5" flagSize={22} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 min-w-0 text-[11px] text-white/50">
            <NewsPill />
            <span className="truncate">{news.sourceName} · {formatRelativeTime(news.createdAt, locale, t.justNow)}</span>
          </span>
          <span className="mt-1 block text-sm font-medium text-white/90 group-hover:text-white leading-snug line-clamp-2">{news.title}</span>
        </span>
      </button>
      {isAuthor && (
        <>
          <HoverTip label={t.newsLinkRemove}>
            <button
              type="button"
              onClick={() => setConfirming(true)}
              aria-label={t.newsLinkRemove}
              className="self-start shrink-0 text-white/40 hover:text-accent transition-colors p-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </HoverTip>
          <ConfirmModal
            open={confirming}
            onClose={() => setConfirming(false)}
            onConfirm={() => remove.mutate(profile.id, { onSuccess: () => setConfirming(false) })}
            title={t.newsLinkRemoveTitle}
            message={t.newsLinkRemoveBody}
            confirmLabel={t.newsLinkRemoveConfirm}
            cancelLabel={t.cancel}
            variant="destructive"
            icon={<NewsIcon className="w-5 h-5 text-white/40" />}
            isPending={remove.isPending}
          />
        </>
      )}
    </div>
  );
}
