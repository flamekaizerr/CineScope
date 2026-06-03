import { useState, useEffect, useCallback } from 'react';
import { Film, Sparkles } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useSessionStorage } from '../hooks/useSessionStorage';
import * as tmdb from '../services/tmdb';
import MediaCard from '../components/common/MediaCard';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import { ANIMATION_STUDIOS, TIME_FILTERS, WATCH_REGIONS } from '../utils/discoveryOptions';
import { MEDIA_TYPES } from '../utils/constants';


function Animation() {
  const [studio, setStudio] = useSessionStorage('animation_studio', 'all');
  const [timeWindow, setTimeWindow] = useSessionStorage('animation_time', 'year');
  const [watchRegion, setWatchRegion] = useSessionStorage('animation_region', 'US');
  const [page, setPage] = useSessionStorage('animation_page', 1);
  const [allTitles, setAllTitles] = useSessionStorage('animation_list', []);
  const [loadingMore, setLoadingMore] = useState(false);

  const {
    data,
    loading,
    error,
  } = useApi(
    () => tmdb.getAnimationMovies({ page: 1, studio, timeWindow, region: watchRegion }),
    [studio, timeWindow, watchRegion]
  );

  useEffect(() => {
    if (data?.results && !loading) {
      setAllTitles((prev) => {
        if (prev.length === 0 || page === 1) {
          return data.results;
        }
        return prev;
      });
    }
  }, [data, loading, page, setAllTitles]);

  const handleLoadMore = useCallback(async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const nextData = await tmdb.getAnimationMovies({
        page: nextPage,
        studio,
        timeWindow,
        region: watchRegion,
      });
      if (nextData?.results) {
        setAllTitles((prev) => [...prev, ...nextData.results]);
        setPage(nextPage);
      }
    } catch (err) {
      console.error('Failed to load more animation:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [page, studio, timeWindow, watchRegion]);

  const totalPages = data?.total_pages || 1;
  const activeStudio = ANIMATION_STUDIOS.find((item) => item.key === studio) || ANIMATION_STUDIOS[0];
  const titles = allTitles;

  return (
    <div className="page animation-page">
      <div className="page-header compact-page-header">
        <div className="page-title-row">
          <Sparkles size={28} />
          <h1>Animation</h1>
        </div>
        <p className="page-subtitle">
          Studio lanes for animation discovery without mixing it into regular movie browsing.
        </p>
      </div>

      <section className="studio-rail" aria-label="Animation studios">
        {ANIMATION_STUDIOS.map((item) => (
          <button
            type="button"
            key={item.key}
            className={`studio-chip ${studio === item.key ? 'studio-chip-active' : ''}`}
            onClick={() => { setStudio(studio === item.key ? 'all' : item.key); setAllTitles([]); setPage(1); }}
          >
            <span className="studio-chip-mark">{item.logo}</span>
            <span>
              <strong>{item.label}</strong>
              <small>{item.description}</small>
            </span>
          </button>
        ))}
      </section>

      <section className="browse-control-panel browse-control-panel-compact" aria-label="Animation filters">
        <div className="browse-inline-toolbar">
          <div className="browse-chip-row browse-chip-row-tight" aria-label="Animation window">
            {TIME_FILTERS.map((item) => (
              <button
                type="button"
                key={item.key}
                className={`browse-chip window-chip ${timeWindow === item.key ? 'browse-chip-active' : ''}`}
                onClick={() => { setTimeWindow(timeWindow === item.key ? 'today' : item.key); setAllTitles([]); setPage(1); }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="active-filters active-filters-always">
        <span className="active-filters-label">Showing:</span>
        <span className="active-filter-tag">{activeStudio.label}</span>
        <span className="active-filter-tag">{TIME_FILTERS.find((item) => item.key === timeWindow)?.label}</span>
      </div>

      {loading ? (
        <div className="media-grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <LoadingSkeleton key={i} type="card" />
          ))}
        </div>
      ) : error ? (
        <div className="error-state">
          <p>Something went wrong loading animation. Please try another studio.</p>
        </div>
      ) : titles.length > 0 ? (
        <>
          <div className="media-grid">
            {titles.map((title) => (
              <MediaCard
                key={title.id}
                item={title}
                mediaType={MEDIA_TYPES.MOVIE}
              />
            ))}
          </div>
          {page < totalPages && (
            <div className="load-more-container">
              <button className="load-more-btn" onClick={handleLoadMore} disabled={loadingMore}>
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <Film size={48} />
          <h3>No animation found</h3>
          <p>Try another studio, region, or time window.</p>
        </div>
      )}
    </div>
  );
}

export default Animation;
