import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNewsItem } from '../../hooks/useNewsList';
import { useNoindex } from '../../hooks/useNoindex';
import { useModalClose } from '../../hooks/useModalClose';
import { ModalShell } from '../common/ModalShell';
import { NewsList } from './NewsList';
import { NewsArticle } from './NewsArticle';
import { NewsIcon } from './NewsBits';
import { NEWS_COPY } from './newsCopy';

// /news and /n/:id on mobile: the same list and story in a sheet over the
// feed. The story carries its own h1, so the sheet title steps down to h2.
export function NewsSheet({ newsId }: { newsId: string | null }) {
  const navigate = useNavigate();
  const location = useLocation();
  const item = useNewsItem(newsId);
  // A story closes back to wherever it was opened from; the list to the feed.
  const closeStory = useModalClose();
  useNoindex(!!newsId);
  useEffect(() => {
    document.title = item.data ? `${item.data.title} - Opinio` : `${NEWS_COPY.title} - Opinio`;
  }, [item.data]);

  return (
    <ModalShell
      onClose={newsId ? closeStory : () => navigate('/' + location.search)}
      title={NEWS_COPY.title}
      titleAs={newsId ? 'h2' : 'h1'}
      icon={<NewsIcon brand />}
    >
      <div className="@container overflow-x-hidden px-3 pt-3 pb-14">
        {newsId ? (
          <div key={newsId} className="news-view-in">
            <button onClick={() => navigate('/news' + location.search)} className="mb-5 inline-flex items-center gap-1 rounded-full bg-white/[0.06] ring-1 ring-white/10 pl-2 pr-3.5 py-1.5 text-sm text-white/75">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.25}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              {NEWS_COPY.back}
            </button>
            {item.data && <NewsArticle news={item.data} />}
          </div>
        ) : (
          <div key="list" className="news-view-back"><NewsList lead={false} /></div>
        )}
      </div>
    </ModalShell>
  );
}
