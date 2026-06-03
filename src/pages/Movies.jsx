import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarDays, Film, MonitorPlay, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import * as tmdb from '../services/tmdb';
import { MEDIA_TYPES } from '../utils/constants';
import MediaCard from '../components/common/MediaCard';
import GenrePill from '../components/common/GenrePill';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import { FALLBACK_MOVIES } from '../utils/fallbackData';
import { MOVIE_COLLECTIONS, STREAMING_PLATFORMS, TIME_FILTERS, WATCH_REGIONS } from '../utils/discoveryOptions';

const TABS = [
  { key: 'now_playing', label: 'Now Playing' },
  { key: 'popular', label: 'Popular' },
  { key: 'top_rated', label: 'Top Rated' },
  { key: 'upcoming', label: 'Upcoming' },
];

const SORT_OPTIONS = [
  { key: 'popularity.desc', label: 'Most Popular' },
  { key: 'vote_average.desc', label: 'Highest Rated' },
  { key: 'primary_release_date.desc', label: 'Newest First' },
  { key: 'primary_release_date.asc', label: 'Oldest First' },
  { key: 'original_title.asc', label: 'Title A-Z' },
];

function Movies() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'now_playing';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [sortBy, setSortBy] = useState('popularity.desc');
  const [providerId, setProviderId] = useState('all');
  const [watchRegion, setWatchRegion] = useState('US');
  const [collection, setCollection] = useState('all');
  const [timeWindow, setTimeWindow] = useState('all');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [page, setPage] = useState(1);
  const [allMovies, setAllMovies] = useState([]);
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
    () => tmdb.getMovies(activeTab, {
      page: 1,
      genreId: selectedGenres.join(','),
      sortBy,
      providerId,
      region: watchRegion,
      collection,
      timeWindow,
    }),
    [activeTab, selectedGenres, sortBy, providerId, watchRegion, collection, timeWindow]
  );

  useEffect(() => {
    if (moviesData?.results) {
      setAllMovies(moviesData.results);
      setPage(1);
    }
  }, [moviesData]);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
    setAllMovies([]);
    setPage(1);
  }, [setSearchParams]);

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
      const data = await tmdb.getMovies(activeTab, {
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
  }, [page, activeTab, selectedGenres, sortBy, providerId, watchRegion, collection, timeWindow]);

  const totalPages = moviesData?.total_pages || 1;
  const genreList = Array.isArray(genres) ? genres : (genres?.genres || []);
  const currentSortLabel = SORT_OPTIONS.find((s) => s.key === sortBy)?.label || 'Sort';
  const currentProviderLabel = STREAMING_PLATFORMS.find((p) => p.key === providerId)?.label || 'All Platforms';
  const currentTimeLabel = TIME_FILTERS.find((t) => t.key === timeWindow)?.label || 'Any Time';
  const displayMovies = allMovies.length > 0 ? allMovies : FALLBACK_MOVIES;

  return (
    <div className="page movies-page">
      <div className="page-header">
        <div className="page-title-row">
          <Film size={28} />
          <h1>Movies</h1>
        </div>

        {/* Tab Navigation */}
        <div className="tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`tab ${activeTab === tab.key ? 'tab-active' : ''}`}
              onClick={() => handleTabChange(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="page-content">
        <section className="browse-control-panel" aria-label="Movie discovery controls">
          <div className="browse-control-header">
            <div>
              <span className="stream-kicker">Browse smarter</span>
              <h2>Collections, platforms, genres, and dates</h2>
            </div>
            <div className="browse-select-group">
              <label>
                <MonitorPlay size={15} aria-hidden="true" />
                <select value={providerId} onChange={(event) => { setProviderId(event.target.value); setAllMovies([]); setPage(1); }}>
                  {STREAMING_PLATFORMS.map((platform) => (
                    <option key={platform.key} value={platform.key}>{platform.label}</option>
                  ))}
                </select>
              </label>
              <label>
                Region
                <select value={watchRegion} onChange={(event) => { setWatchRegion(event.target.value); setAllMovies([]); setPage(1); }}>
                  {WATCH_REGIONS.map((region) => (
                    <option key={region.key} value={region.key}>{region.label}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="browse-chip-row" aria-label="Movie collections">
            {MOVIE_COLLECTIONS.map((item) => (
              <button
                key={item.key}
                className={`browse-chip ${collection === item.key ? 'browse-chip-active' : ''}`}
                onClick={() => { setCollection(item.key); setAllMovies([]); setPage(1); }}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="browse-chip-row" aria-label="Release window">
            <span className="browse-row-label"><CalendarDays size={14} aria-hidden="true" /> Window</span>
            {TIME_FILTERS.map((item) => (
              <button
                key={item.key}
                className={`browse-chip ${timeWindow === item.key ? 'browse-chip-active' : ''}`}
                onClick={() => { setTimeWindow(item.key); setAllMovies([]); setPage(1); }}
              >
                {item.label}
              </button>
            ))}
          </div>
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

          {/* Sort Dropdown */}
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
        </div>

        {/* Active Filters Display */}
        {(selectedGenres.length > 0 || collection !== 'all' || providerId !== 'all' || timeWindow !== 'all') && (
          <div className="active-filters">
            <span className="active-filters-label">Filtered by:</span>
            {collection !== 'all' && <span className="active-filter-tag">{MOVIE_COLLECTIONS.find((item) => item.key === collection)?.label}</span>}
            {providerId !== 'all' && <span className="active-filter-tag">{currentProviderLabel}</span>}
            {timeWindow !== 'all' && <span className="active-filter-tag">{currentTimeLabel}</span>}
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
        )}

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
