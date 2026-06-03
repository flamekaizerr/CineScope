import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, Clock, TrendingUp, Film, Tv, Sparkles } from 'lucide-react';
import { useDebouncedSearch } from '../hooks/useDebouncedSearch';
import { useApi } from '../hooks/useApi';
import * as tmdb from '../services/tmdb';
import * as jikan from '../services/jikan';
import MediaCard from '../components/common/MediaCard';
import SearchBar from '../components/common/SearchBar';
import LoadingSkeleton from '../components/common/LoadingSkeleton';

const FILTER_TABS = [
  { key: 'all', label: 'All', icon: null },
  { key: 'movie', label: 'Movies', icon: Film },
  { key: 'tv', label: 'TV Shows', icon: Tv },
  { key: 'anime', label: 'Anime', icon: Sparkles },
];

const RECENT_SEARCHES_KEY = 'cinescope_recent_searches';
const MAX_RECENT_SEARCHES = 10;

function getRecentSearches() {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(query) {
  if (!query.trim()) return;
  try {
    const recent = getRecentSearches();
    const filtered = recent.filter((s) => s.toLowerCase() !== query.toLowerCase());
    filtered.unshift(query);
    localStorage.setItem(
      RECENT_SEARCHES_KEY,
      JSON.stringify(filtered.slice(0, MAX_RECENT_SEARCHES))
    );
  } catch {
    // Silently fail on storage errors
  }
}

function clearRecentSearches() {
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // Silently fail
  }
}

function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [activeFilter, setActiveFilter] = useState('all');
  const [recentSearches, setRecentSearches] = useState(getRecentSearches);

  const {
    query,
    setQuery,
    debouncedQuery,
  } = useDebouncedSearch(initialQuery, 400);

  const [page, setPage] = useState(1);
  const [allResults, setAllResults] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);

  // TMDB multi search
  const {
    data: tmdbResults,
    loading: tmdbLoading,
    error: tmdbError,
  } = useApi(
    () => (debouncedQuery && activeFilter !== 'anime'
      ? tmdb.searchMulti(debouncedQuery)
      : Promise.resolve(null)),
    [debouncedQuery, activeFilter]
  );

  // Jikan anime search
  const {
    data: animeResults,
    loading: animeLoading,
    error: animeError,
  } = useApi(
    () => (debouncedQuery && (activeFilter === 'all' || activeFilter === 'anime')
      ? jikan.searchAnime(debouncedQuery)
      : Promise.resolve(null)),
    [debouncedQuery, activeFilter]
  );

  // Trending searches (shown when empty)
  const {
    data: trendingData,
    loading: trendingLoading,
  } = useApi(
    () => (!debouncedQuery ? tmdb.getTrending('all', 'day') : Promise.resolve(null)),
    [debouncedQuery]
  );

  // Save to recent searches when query changes
  useEffect(() => {
    if (debouncedQuery) {
      saveRecentSearch(debouncedQuery);
      setRecentSearches(getRecentSearches());
      setSearchParams({ q: debouncedQuery });
    }
  }, [debouncedQuery, setSearchParams]);

  const handleClearRecent = useCallback(() => {
    clearRecentSearches();
    setRecentSearches([]);
  }, []);

  const handleRecentClick = useCallback((searchTerm) => {
    setQuery(searchTerm);
  }, [setQuery]);

  // Combine and filter results on first load
  useEffect(() => {
    if (tmdbLoading || animeLoading) return;
    const combined = [];

    // Add TMDB results
    if (tmdbResults?.results) {
      tmdbResults.results.forEach((item) => {
        if (item.media_type === 'person') return;
        if (activeFilter === 'all' || activeFilter === item.media_type) {
          combined.push(item);
        }
      });
    }

    // Add anime results
    if (animeResults?.data) {
      animeResults.data.forEach((anime) => {
        combined.push({
          id: anime.mal_id,
          title: anime.title_english || anime.title,
          poster_path: anime.images?.jpg?.large_image_url,
          vote_average: anime.score,
          media_type: 'anime',
          release_date: anime.aired?.from,
          overview: anime.synopsis,
        });
      });
    }

    setAllResults(combined);
    setPage(1);
  }, [tmdbResults, animeResults, activeFilter, tmdbLoading, animeLoading]);

  const handleLoadMore = useCallback(async () => {
    if (!debouncedQuery) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const data = await tmdb.searchMulti(debouncedQuery, nextPage);
      if (data?.results) {
        const newResults = [];
        data.results.forEach((item) => {
          if (item.media_type === 'person') return;
          if (activeFilter === 'all' || activeFilter === item.media_type) {
            newResults.push(item);
          }
        });
        setAllResults((prev) => [...prev, ...newResults]);
        setPage(nextPage);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  }, [debouncedQuery, page, activeFilter]);

  const isLoading = tmdbLoading || animeLoading;
  const hasError = tmdbError || animeError;
  const hasQuery = (debouncedQuery || '').length > 0;
  const trendingItems = trendingData?.results?.slice(0, 10) || [];

  return (
    <div className="page search-page">
      <div className="page-header">
        <h1>Search</h1>

        {/* Search Input */}
        <div className="search-input-wrapper">
          <SearchBar
            value={query}
            onChange={(nextQuery) => {
              setQuery(nextQuery);
              if (!nextQuery) setSearchParams({});
            }}
            placeholder="Search movies, TV shows, anime..."
          />
        </div>

        {/* Filter Tabs */}
        {hasQuery && (
          <div className="tabs">
            {FILTER_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  className={`tab ${activeFilter === tab.key ? 'tab-active' : ''}`}
                  onClick={() => setActiveFilter(tab.key)}
                >
                  {Icon && <Icon size={14} aria-hidden="true" />}
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="page-content">
        {/* Loading */}
        {hasQuery && isLoading && (
          <div className="media-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <LoadingSkeleton key={i} type="card" />
            ))}
          </div>
        )}

        {/* Error */}
        {hasQuery && hasError && !isLoading && (
          <div className="error-state">
            <p>Something went wrong with your search. Please try again.</p>
          </div>
        )}

        {/* Results */}
        {hasQuery && !isLoading && !hasError && allResults.length > 0 && (
          <>
            <p className="search-result-count">
              Found {allResults.length} result{allResults.length !== 1 ? 's' : ''} for "{debouncedQuery}"
            </p>
            <div className="media-grid">
              {allResults.map((item, index) => (
                <MediaCard
                  key={`${item.media_type}-${item.id}-${index}`}
                  item={item}
                  mediaType={item.media_type}
                />
              ))}
            </div>

            {/* Load More Button */}
            {tmdbResults && page < tmdbResults.total_pages && activeFilter !== 'anime' && (
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
        )}

        {/* No Results */}
        {hasQuery && !isLoading && !hasError && allResults.length === 0 && (
          <div className="empty-state">
            <SearchIcon size={48} />
            <h3>No results found</h3>
            <p>No matches for "{debouncedQuery}". Try a different search term or check your spelling.</p>
            <div className="search-suggestions">
              <p>Suggestions:</p>
              <ul>
                <li>Check for typos or misspellings</li>
                <li>Try using broader keywords</li>
                <li>Search by the original title</li>
              </ul>
            </div>
          </div>
        )}

        {/* Empty State: Recent Searches + Trending */}
        {!hasQuery && (
          <>
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <section className="section">
                <div className="section-header">
                  <div className="section-title">
                    <Clock size={18} />
                    <h2>Recent Searches</h2>
                  </div>
                  <button className="btn btn-text" onClick={handleClearRecent}>
                    Clear All
                  </button>
                </div>
                <div className="recent-searches-list">
                  {recentSearches.map((term, i) => (
                    <button
                      key={i}
                      className="recent-search-item"
                      onClick={() => handleRecentClick(term)}
                    >
                      <Clock size={14} />
                      <span>{term}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Trending Searches */}
            <section className="section">
              <div className="section-header">
                <div className="section-title">
                  <TrendingUp size={18} />
                  <h2>Trending Now</h2>
                </div>
              </div>
              {trendingLoading ? (
                <div className="media-grid">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <LoadingSkeleton key={i} type="card" />
                  ))}
                </div>
              ) : trendingItems.length > 0 ? (
                <div className="media-grid">
                  {trendingItems.map((item) => (
                    <MediaCard
                      key={item.id}
                      item={item}
                      mediaType={item.media_type}
                    />
                  ))}
                </div>
              ) : (
                <p className="empty-message">No trending content available.</p>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default Search;
