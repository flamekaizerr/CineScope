import { useState, useEffect, useCallback } from 'react';
import { Flame } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import * as tmdb from '../services/tmdb';
import MediaCard from '../components/common/MediaCard';
import LoadingSkeleton from '../components/common/LoadingSkeleton';

function TrendingToday() {
  const [page, setPage] = useState(1);
  const [allTrending, setAllTrending] = useState([]);
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
    if (data?.results && !loading) {
      setAllTrending((prev) => {
        if (prev.length === 0 || page === 1) {
          return data.results;
        }
        return prev;
      });
    }
  }, [data, loading, page, setAllTrending]);

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
