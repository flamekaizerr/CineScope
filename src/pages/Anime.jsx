import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sparkles, X } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import * as jikan from '../services/jikan';
import { MEDIA_TYPES } from '../utils/constants';
import MediaCard from '../components/common/MediaCard';
import GenrePill from '../components/common/GenrePill';
import LoadingSkeleton from '../components/common/LoadingSkeleton';

const TABS = [
  { key: 'season', label: 'This Season' },
  { key: 'airing', label: 'Top Airing' },
  { key: 'popular', label: 'Most Popular' },
  { key: 'upcoming', label: 'Upcoming' },
];

const ANIME_GENRES = [
  { id: 1, name: 'Action' },
  { id: 2, name: 'Adventure' },
  { id: 4, name: 'Comedy' },
  { id: 8, name: 'Drama' },
  { id: 10, name: 'Fantasy' },
  { id: 14, name: 'Horror' },
  { id: 7, name: 'Mystery' },
  { id: 22, name: 'Romance' },
  { id: 24, name: 'Sci-Fi' },
  { id: 36, name: 'Slice of Life' },
  { id: 30, name: 'Sports' },
  { id: 37, name: 'Supernatural' },
  { id: 41, name: 'Thriller' },
];

function fetchAnimeByTab(tab, page, genres) {
  const params = { page, genres: genres.join(',') };
  switch (tab) {
    case 'season':
      return jikan.getSeasonNow(page);
    case 'airing':
      return jikan.getTopAiring(page);
    case 'popular':
      return jikan.getTopAnime({ page, filter: 'bypopularity', genres: genres.join(',') });
    case 'upcoming':
      return jikan.getUpcomingAnime(page);
    default:
      return jikan.getSeasonNow(page);
  }
}

function normalizeAnime(anime) {
  return {
    id: anime.mal_id,
    title: anime.title_english || anime.title,
    poster_path: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url,
    vote_average: anime.score,
    media_type: 'anime',
    release_date: anime.aired?.from,
    overview: anime.synopsis,
    episodes: anime.episodes,
    status: anime.status,
  };
}

function Anime() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'season';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [page, setPage] = useState(1);
  const [allAnime, setAllAnime] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);

  const {
    data: animeData,
    loading: animeLoading,
    error: animeError,
  } = useApi(
    () => fetchAnimeByTab(activeTab, 1, selectedGenres),
    [activeTab, selectedGenres]
  );

  useEffect(() => {
    if (animeData?.data) {
      setAllAnime(animeData.data.map(normalizeAnime));
      setPage(1);
    }
  }, [animeData]);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
    setAllAnime([]);
    setPage(1);
  }, [setSearchParams]);

  const handleGenreToggle = useCallback((genreId) => {
    setSelectedGenres((prev) =>
      prev.includes(genreId)
        ? prev.filter((id) => id !== genreId)
        : [...prev, genreId]
    );
    setAllAnime([]);
    setPage(1);
  }, []);

  const handleClearGenres = useCallback(() => {
    setSelectedGenres([]);
    setAllAnime([]);
    setPage(1);
  }, []);

  const handleLoadMore = useCallback(async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const data = await fetchAnimeByTab(activeTab, nextPage, selectedGenres);
      if (data?.data) {
        setAllAnime((prev) => [...prev, ...data.data.map(normalizeAnime)]);
        setPage(nextPage);
      }
    } catch (err) {
      console.error('Failed to load more anime:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [page, activeTab, selectedGenres]);

  const hasNextPage = animeData?.pagination?.has_next_page ?? false;

  return (
    <div className="page anime-page">
      <div className="page-header">
        <div className="page-title-row">
          <Sparkles size={28} />
          <h1>Anime</h1>
        </div>

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
        {/* Genre Filters */}
        <div className="filters-row">
          <div className="genre-filters">
            {ANIME_GENRES.map((genre) => (
              <GenrePill
                key={genre.id}
                genre={genre}
                active={selectedGenres.includes(genre.id)}
                onClick={() => handleGenreToggle(genre.id)}
              />
            ))}
            {selectedGenres.length > 0 && (
              <button className="clear-filters-btn" onClick={handleClearGenres}>
                <X size={14} /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Active Filters */}
        {selectedGenres.length > 0 && (
          <div className="active-filters">
            <span className="active-filters-label">Filtered by:</span>
            {selectedGenres.map((genreId) => {
              const genre = ANIME_GENRES.find((g) => g.id === genreId);
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

        {/* Anime Grid */}
        {animeLoading ? (
          <div className="media-grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <LoadingSkeleton key={i} type="card" />
            ))}
          </div>
        ) : animeError ? (
          <div className="error-state">
            <p>Something went wrong loading anime. Please try again.</p>
          </div>
        ) : allAnime.length > 0 ? (
          <>
            <div className="media-grid">
              {allAnime.map((anime) => (
                <MediaCard
                  key={anime.id}
                  item={anime}
                  mediaType="anime"
                />
              ))}
            </div>

            {hasNextPage && (
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
            <Sparkles size={48} />
            <h3>No anime found</h3>
            <p>Try adjusting your filters or switching tabs.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Anime;
