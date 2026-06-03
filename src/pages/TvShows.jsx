import { useState, useEffect, useCallback } from 'react';
import { CalendarDays, MonitorPlay, Tv, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import * as tmdb from '../services/tmdb';
import { MEDIA_TYPES } from '../utils/constants';
import MediaCard from '../components/common/MediaCard';
import GenrePill from '../components/common/GenrePill';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import { FALLBACK_TV } from '../utils/fallbackData';
import { STREAMING_PLATFORMS, TIME_FILTERS, TV_COLLECTIONS, WATCH_REGIONS } from '../utils/discoveryOptions';

const SORT_OPTIONS = [
  { key: 'popularity.desc', label: 'Most Popular' },
  { key: 'vote_average.desc', label: 'Highest Rated' },
  { key: 'first_air_date.desc', label: 'Newest First' },
  { key: 'first_air_date.asc', label: 'Oldest First' },
  { key: 'name.asc', label: 'Title A-Z' },
];

function TvShows() {
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [sortBy, setSortBy] = useState('popularity.desc');
  const [providerId, setProviderId] = useState('all');
  const [watchRegion, setWatchRegion] = useState('US');
  const [collection, setCollection] = useState('all');
  const [timeWindow, setTimeWindow] = useState('today');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [page, setPage] = useState(1);
  const [allShows, setAllShows] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);

  const {
    data: genres,
    loading: genresLoading,
  } = useApi(() => tmdb.getGenres('tv'), []);

  const {
    data: showsData,
    loading: showsLoading,
    error: showsError,
  } = useApi(
    () => tmdb.getTvShows('popular', {
      page: 1,
      genreId: selectedGenres.join(','),
      sortBy,
      providerId,
      region: watchRegion,
      collection,
      timeWindow,
    }),
    [selectedGenres, sortBy, providerId, watchRegion, collection, timeWindow]
  );

  useEffect(() => {
    if (showsData?.results) {
      setAllShows(showsData.results);
      setPage(1);
    }
  }, [showsData]);

  const handleGenreToggle = useCallback((genreId) => {
    setSelectedGenres((prev) =>
      prev.includes(genreId)
        ? prev.filter((id) => id !== genreId)
        : [...prev, genreId]
    );
    setAllShows([]);
    setPage(1);
  }, []);

  const handleClearGenres = useCallback(() => {
    setSelectedGenres([]);
    setAllShows([]);
    setPage(1);
  }, []);

  const handleSortChange = useCallback((sort) => {
    setSortBy(sort);
    setShowSortDropdown(false);
    setAllShows([]);
    setPage(1);
  }, []);

  const handleLoadMore = useCallback(async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const data = await tmdb.getTvShows('popular', {
        page: nextPage,
        genreId: selectedGenres.join(','),
        sortBy,
        providerId,
        region: watchRegion,
        collection,
        timeWindow,
      });
      if (data?.results) {
        setAllShows((prev) => [...prev, ...data.results]);
        setPage(nextPage);
      }
    } catch (err) {
      console.error('Failed to load more TV shows:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [page, selectedGenres, sortBy, providerId, watchRegion, collection, timeWindow]);

  const totalPages = showsData?.total_pages || 1;
  const genreList = Array.isArray(genres) ? genres : (genres?.genres || []);
  const currentSortLabel = SORT_OPTIONS.find((s) => s.key === sortBy)?.label || 'Sort';
  const currentProvider = STREAMING_PLATFORMS.find((p) => p.key === providerId) || STREAMING_PLATFORMS[0];
  const currentProviderLabel = currentProvider.label;
  const currentTimeLabel = TIME_FILTERS.find((t) => t.key === timeWindow)?.label || 'Any Time';
  const currentRegionLabel = WATCH_REGIONS.find((r) => r.key === watchRegion)?.label || watchRegion;
  const displayShows = allShows.length > 0 ? allShows : FALLBACK_TV;

  return (
    <div className="page tv-page">
      <div className="page-header">
        <div className="page-title-row">
          <Tv size={28} />
          <h1>TV Shows</h1>
        </div>
        <p className="page-subtitle">Streaming TV that is hot today, with quick platform, region, and genre switching.</p>
      </div>

      <div className="page-content">
        <section className="browse-control-panel browse-control-panel-compact" aria-label="TV discovery controls">
          <div className="browse-inline-toolbar">
            <div className="sort-dropdown-wrapper">
              <button
                className="sort-btn"
                onClick={() => setShowSortDropdown(!showSortDropdown)}
              >
                <SlidersHorizontal size={16} />
                {currentSortLabel}
                <ChevronDown size={14} />
              </button>
              {showSortDropdown && (
                <div className="sort-dropdown">
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option.key}
                      className={`sort-option ${sortBy === option.key ? 'sort-option-active' : ''}`}
                      onClick={() => handleSortChange(option.key)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <label className="browse-inline-select">
              <MonitorPlay size={15} aria-hidden="true" />
              <select value={providerId} onChange={(event) => { setProviderId(event.target.value); setAllShows([]); setPage(1); }}>
                {STREAMING_PLATFORMS.map((platform) => (
                  <option key={platform.key} value={platform.key}>{platform.label}</option>
                ))}
              </select>
            </label>

            <div className="browse-chip-row browse-chip-row-tight" aria-label="TV trend window">
              {TIME_FILTERS.filter((item) => item.key !== 'all').map((item) => (
                <button
                  key={item.key}
                  className={`browse-chip window-chip ${timeWindow === item.key ? 'browse-chip-active' : ''}`}
                  onClick={() => { setTimeWindow(item.key); setAllShows([]); setPage(1); }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <label className="browse-inline-select">
              Region
              <select value={watchRegion} onChange={(event) => { setWatchRegion(event.target.value); setAllShows([]); setPage(1); }}>
                {WATCH_REGIONS.map((region) => (
                  <option key={region.key} value={region.key}>{region.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="browse-chip-row" aria-label="TV collections">
            {TV_COLLECTIONS.map((item) => (
              <button
                key={item.key}
                className={`browse-chip ${collection === item.key ? 'browse-chip-active' : ''}`}
                onClick={() => { setCollection(item.key); setAllShows([]); setPage(1); }}
              >
                {item.label}
              </button>
            ))}
          </div>

          <span className="browse-control-note"><CalendarDays size={14} aria-hidden="true" /> Region controls streaming availability for All Platforms and specific services.</span>
        </section>

        {/* Filters Row */}
        <div className="filters-row">
          <div className="genre-filters">
            {genresLoading ? (
              <LoadingSkeleton type="chips" count={8} />
            ) : (
              <>
                {genreList.map((genre) => (
                  <GenrePill
                    key={genre.id}
                    genre={genre}
                    isActive={selectedGenres.includes(genre.id)}
                    onClick={() => handleGenreToggle(genre.id)}
                  />
                ))}
                {selectedGenres.length > 0 && (
                  <button className="clear-filters-btn" onClick={handleClearGenres}>
                    <X size={14} /> Clear
                  </button>
                )}
              </>
            )}
          </div>

        </div>

        {/* Active Filters */}
          <div className="active-filters active-filters-always">
            <span className="active-filters-label">Filtered by:</span>
            <span className="active-filter-tag">{currentProviderLabel}</span>
            <span className="active-filter-tag">{TV_COLLECTIONS.find((item) => item.key === collection)?.label}</span>
            <span className="active-filter-tag">{currentTimeLabel}</span>
            <span className="active-filter-tag">{currentRegionLabel}</span>
            {selectedGenres.map((genreId) => {
              const genre = genreList.find((g) => g.id === genreId);
              return genre ? (
                <span key={genreId} className="active-filter-tag">
                  {genre.name}
                  <button onClick={() => handleGenreToggle(genreId)}>
                    <X size={12} />
                  </button>
                </span>
              ) : null;
            })}
          </div>

        {/* TV Shows Grid */}
        {showsLoading ? (
          <div className="media-grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <LoadingSkeleton key={i} type="card" />
            ))}
          </div>
        ) : showsError && displayShows.length === 0 ? (
          <div className="error-state">
            <p>Something went wrong loading TV shows. Please try again.</p>
          </div>
        ) : displayShows.length > 0 ? (
          <>
            <div className="media-grid">
              {displayShows.map((show) => (
                <MediaCard
                  key={show.id}
                  item={show}
                  mediaType={MEDIA_TYPES.TV}
                  platformLabel={currentProvider.shortLabel || currentProviderLabel}
                />
              ))}
            </div>

            {page < totalPages && (
              <div className="load-more-container">
                <button
                  className="load-more-btn"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <Tv size={48} />
            <h3>No TV shows found</h3>
            <p>Try adjusting your filters or switching tabs.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default TvShows;
