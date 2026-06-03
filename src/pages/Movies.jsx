import { useState, useEffect, useCallback, useRef } from 'react';
import { CalendarDays, Film, MonitorPlay, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import * as tmdb from '../services/tmdb';
import { MEDIA_TYPES } from '../utils/constants';
import MediaCard from '../components/common/MediaCard';
import GenrePill from '../components/common/GenrePill';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import { useSessionStorage } from '../hooks/useSessionStorage';

import { MOVIE_COLLECTIONS, STREAMING_PLATFORMS, TIME_FILTERS, WATCH_REGIONS } from '../utils/discoveryOptions';

const SORT_OPTIONS = [
  { key: 'popularity.desc', label: 'Most Popular' },
  { key: 'vote_average.desc', label: 'Highest Rated' },
  { key: 'primary_release_date.desc', label: 'Newest First' },
  { key: 'primary_release_date.asc', label: 'Oldest First' },
  { key: 'original_title.asc', label: 'Title A-Z' },
];

function Movies() {
  const [selectedGenres, setSelectedGenres] = useSessionStorage('movies_genres', []);
  const [sortBy, setSortBy] = useSessionStorage('movies_sort', 'popularity.desc');
  const [providerId, setProviderId] = useSessionStorage('movies_provider', 'all');
  const [watchRegion, setWatchRegion] = useSessionStorage('movies_region', 'US');
  const [collection, setCollection] = useSessionStorage('movies_collection', 'all');
  const [timeWindow, setTimeWindow] = useSessionStorage('movies_time', 'today');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [page, setPage] = useSessionStorage('movies_page', 1);
  const [allMovies, setAllMovies] = useSessionStorage('movies_list', []);
  const [loadingMore, setLoadingMore] = useState(false);

  const {
    data: genres,
    loading: genresLoading,
  } = useApi(() => tmdb.getGenres('movie'), []);

  const {
    data: moviesData,
    loading: moviesLoading,
    error: moviesError,
  } = useApi(
    () => tmdb.getMovies('popular', {
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

  const filtersRef = useRef({ selectedGenres, sortBy, providerId, watchRegion, collection, timeWindow });

  useEffect(() => {
    const currentFilters = { selectedGenres, sortBy, providerId, watchRegion, collection, timeWindow };
    const filtersChanged = JSON.stringify(filtersRef.current) !== JSON.stringify(currentFilters);
    
    if (moviesData?.results) {
      if (filtersChanged || allMovies.length === 0) {
        setAllMovies(moviesData.results);
        setPage(1);
        filtersRef.current = currentFilters;
      }
    }
  }, [moviesData, selectedGenres, sortBy, providerId, watchRegion, collection, timeWindow]);

  const handleGenreToggle = useCallback((genreId) => {
    setSelectedGenres((prev) =>
      prev.includes(genreId)
        ? prev.filter((id) => id !== genreId)
        : [...prev, genreId]
    );
    setAllMovies([]);
    setPage(1);
  }, []);

  const handleClearGenres = useCallback(() => {
    setSelectedGenres([]);
    setAllMovies([]);
    setPage(1);
  }, []);

  const handleSortChange = useCallback((sort) => {
    setSortBy(sort);
    setShowSortDropdown(false);
    setAllMovies([]);
    setPage(1);
  }, []);

  const handleLoadMore = useCallback(async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const data = await tmdb.getMovies('popular', {
        page: nextPage,
        genreId: selectedGenres.join(','),
        sortBy,
        providerId,
        region: watchRegion,
        collection,
        timeWindow,
      });
      if (data?.results) {
        setAllMovies((prev) => [...prev, ...data.results]);
        setPage(nextPage);
      }
    } catch (err) {
      console.error('Failed to load more movies:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [page, selectedGenres, sortBy, providerId, watchRegion, collection, timeWindow]);

  const totalPages = moviesData?.total_pages || 1;
  const genreList = Array.isArray(genres) ? genres : (genres?.genres || []);
  const currentSortLabel = SORT_OPTIONS.find((s) => s.key === sortBy)?.label || 'Sort';
  const currentProvider = STREAMING_PLATFORMS.find((p) => p.key === providerId) || STREAMING_PLATFORMS[0];
  const currentProviderLabel = currentProvider.label;
  const currentTimeLabel = TIME_FILTERS.find((t) => t.key === timeWindow)?.label || 'Any Time';
  const currentRegionLabel = WATCH_REGIONS.find((r) => r.key === watchRegion)?.label || watchRegion;
  const displayMovies = allMovies;

  return (
    <div className="page movies-page">
      <div className="page-header">
        <div className="page-title-row">
          <Film size={28} />
          <h1>Movies</h1>
        </div>
        <p className="page-subtitle">Trending movies on streaming today, filtered by platform, region, genre, and collection.</p>
      </div>

      <div className="page-content">
        <section className="browse-control-panel browse-control-panel-compact" aria-label="Movie discovery controls">
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
              <select value={providerId} onChange={(event) => { setProviderId(event.target.value); setAllMovies([]); setPage(1); }}>
                {STREAMING_PLATFORMS.map((platform) => (
                  <option key={platform.key} value={platform.key}>{platform.label}</option>
                ))}
              </select>
            </label>

            <div className="browse-chip-row browse-chip-row-tight" aria-label="Movie trend window">
              {TIME_FILTERS.filter((item) => item.key !== 'all').map((item) => (
                <button
                  key={item.key}
                  className={`browse-chip window-chip ${timeWindow === item.key ? 'browse-chip-active' : ''}`}
                  onClick={() => { setTimeWindow(timeWindow === item.key ? 'today' : item.key); setAllMovies([]); setPage(1); }}
                >
                  {item.label}
                </button>
              ))}
            </div>


          </div>

          <div className="browse-chip-row" aria-label="Movie collections">
            {MOVIE_COLLECTIONS.map((item) => (
              <button
                key={item.key}
                className={`browse-chip ${collection === item.key ? 'browse-chip-active' : ''}`}
                onClick={() => { setCollection(collection === item.key ? 'all' : item.key); setAllMovies([]); setPage(1); }}
              >
                {item.label}
              </button>
            ))}
          </div>

          <span className="browse-control-note"><CalendarDays size={14} aria-hidden="true" /> Region controls streaming availability for All Platforms and specific services.</span>
        </section>

        {/* Filters Row */}
        <div className="filters-row">
          {/* Genre Chips */}
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

        {/* Active Filters Display */}
        <div className="active-filters active-filters-always">
            <span className="active-filters-label">Filtered by:</span>
            <span className="active-filter-tag">{currentProviderLabel}</span>
            <span className="active-filter-tag">{MOVIE_COLLECTIONS.find((item) => item.key === collection)?.label}</span>
            <span className="active-filter-tag">{currentTimeLabel}</span>

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

        {/* Movies Grid */}
        {moviesLoading ? (
          <div className="media-grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <LoadingSkeleton key={i} type="card" />
            ))}
          </div>
        ) : moviesError && displayMovies.length === 0 ? (
          <div className="error-state">
            <p>Something went wrong loading movies. Please try again.</p>
          </div>
        ) : displayMovies.length > 0 ? (
          <>
            <div className="media-grid">
              {displayMovies.map((movie) => (
                <MediaCard
                  key={movie.id}
                  item={movie}
                  mediaType={MEDIA_TYPES.MOVIE}
                  platformLabel={currentProvider.shortLabel || currentProviderLabel}
                />
              ))}
            </div>

            {/* Load More */}
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
            <Film size={48} />
            <h3>No movies found</h3>
            <p>Try adjusting your filters or switching tabs.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Movies;
