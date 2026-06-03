import { useState, useEffect, useCallback } from 'react';
import { Flame } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import * as tmdb from '../services/tmdb';
import MediaCard from '../components/common/MediaCard';
import LoadingSkeleton from '../components/common/LoadingSkeleton';

function TrendingToday() {
  const [page, setPage] = useState(1);
  const [allTrending, setAllTrending] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [timeWindow, setTimeWindow] = useState('day'); // 'day' or 'week'

  const {
    data,
    loading,
    error,
  } = useApi(
    () => tmdb.getTrending('all', timeWindow),
    [timeWindow]
  );

  useEffect(() => {
    if (data?.results) {
      // getTrending currently returns a single page from our implementation, 
      // but in case it supports pagination later, we set it up this way.
      setAllTrending(data.results);
      setPage(1);
    }
  }, [data]);

  const handleLoadMore = useCallback(async () => {
    // Note: getTrending in tmdb.js currently doesn't accept page param, 
    // but if it did, we'd pass it here. For now, we'll just handle it safely.
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      // Mocking pagination since tmdb.getTrending doesn't have page param yet
      // If we update tmdb.js to support page, we pass it here.
      setPage(nextPage);
    } catch (err) {
      console.error('Failed to load more trending:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [page, timeWindow]);

  const totalPages = data?.total_pages || 1;

  return (
    <div className="page trending-page">
      <div className="page-header compact-page-header">
        <div className="page-title-row">
          <Flame size={28} />
          <h1>Trending</h1>
        </div>
        <p className="page-subtitle">
          The hottest movies and TV shows everyone is watching right now.
        </p>
      </div>

      <section className="browse-control-panel browse-control-panel-compact" aria-label="Trending filters">
        <div className="browse-inline-toolbar">
          <div className="browse-chip-row browse-chip-row-tight" aria-label="Trending window">
            <button
              type="button"
              className={`browse-chip window-chip ${timeWindow === 'day' ? 'browse-chip-active' : ''}`}
              onClick={() => { setTimeWindow('day'); setAllTrending([]); setPage(1); }}
            >
              Today
            </button>
            <button
              type="button"
              className={`browse-chip window-chip ${timeWindow === 'week' ? 'browse-chip-active' : ''}`}
              onClick={() => { setTimeWindow('week'); setAllTrending([]); setPage(1); }}
            >
              This Week
            </button>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="media-grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <LoadingSkeleton key={i} type="card" />
          ))}
        </div>
      ) : error ? (
        <div className="error-state">
          <p>Something went wrong loading trending titles. Please try again.</p>
        </div>
      ) : allTrending.length > 0 ? (
        <>
          <div className="media-grid">
            {allTrending.map((title) => (
              <MediaCard
                key={`${title.media_type}-${title.id}`}
                item={title}
                mediaType={title.media_type || 'movie'}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="empty-state">
          <Flame size={48} />
          <h3>No trending titles found</h3>
        </div>
      )}
    </div>
  );
}

export default TrendingToday;
