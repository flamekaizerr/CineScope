import { useState, useEffect, useCallback } from 'react';
import { CalendarDays, Clapperboard, Sparkles, X } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import * as jikan from '../services/jikan';
import MediaCard from '../components/common/MediaCard';
import GenrePill from '../components/common/GenrePill';
import LoadingSkeleton from '../components/common/LoadingSkeleton';

import { ANIME_FORMATS, TIME_FILTERS } from '../utils/discoveryOptions';

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
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [format, setFormat] = useState('all');
  const [timeWindow, setTimeWindow] = useState('today');
  const [page, setPage] = useState(1);
  const [allAnime, setAllAnime] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);

  const {
    data: animeData,
    loading: animeLoading,
    error: animeError,
  } = useApi(
    () => jikan.browseAnime({ tab: 'airing', page: 1, genres: selectedGenres, format, timeWindow }),
    [selectedGenres, format, timeWindow]
  );

  useEffect(() => {
    if (animeData?.data) {
      setAllAnime(animeData.data.map(normalizeAnime));
      setPage(1);
    }
  }, [animeData]);

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
      const data = await jikan.browseAnime({ tab: 'airing', page: nextPage, genres: selectedGenres, format, timeWindow });
      if (data?.data) {
        setAllAnime((prev) => [...prev, ...data.data.map(normalizeAnime)]);
        setPage(nextPage);
      }
    } catch (err) {
      console.error('Failed to load more anime:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [page, selectedGenres, format, timeWindow]);

  const hasNextPage = animeData?.pagination?.has_next_page ?? false;
  const displayAnime = allAnime;

  return (
    <div className="page anime-page">
      <div className="page-header">
        <div className="page-title-row">
          <Sparkles size={28} />
          <h1>Anime</h1>
        </div>
        <p className="page-subtitle">Airing anime discovery with format, window, and genre controls kept close to the cards.</p>
      </div>

      <div className="page-content">
        <section className="browse-control-panel browse-control-panel-compact" aria-label="Anime discovery controls">
          <div className="browse-inline-toolbar">
          <div className="browse-chip-row browse-chip-row-tight" aria-label="Anime format">
            <span className="browse-row-label"><Clapperboard size={14} aria-hidden="true" /> Format</span>
            {ANIME_FORMATS.map((item) => (
              <button
                key={item.key}
                className={`browse-chip filter-chip ${format === item.key ? 'browse-chip-active' : ''}`}
                onClick={() => { setFormat(item.key); setAllAnime([]); setPage(1); }}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="browse-chip-row browse-chip-row-tight" aria-label="Anime window">
            <span className="browse-row-label"><CalendarDays size={14} aria-hidden="true" /> Window</span>
            {TIME_FILTERS.filter((item) => item.key !== 'all').map((item) => (
              <button
                key={item.key}
                className={`browse-chip window-chip ${timeWindow === item.key ? 'browse-chip-active' : ''}`}
                onClick={() => { setTimeWindow(item.key); setAllAnime([]); setPage(1); }}
              >
                {item.label}
              </button>
            ))}
          </div>
          </div>
        </section>

        {/* Genre Filters */}
        <div className="filters-row">
          <div className="genre-filters">
            {ANIME_GENRES.map((genre) => (
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
          </div>
        </div>

        {/* Active Filters */}
          <div className="active-filters active-filters-always">
            <span className="active-filters-label">Filtered by:</span>
            <span className="active-filter-tag">{ANIME_FORMATS.find((item) => item.key === format)?.label}</span>
            <span className="active-filter-tag">{TIME_FILTERS.find((item) => item.key === timeWindow)?.label}</span>
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

        {/* Anime Grid */}
        {animeLoading ? (
          <div className="media-grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <LoadingSkeleton key={i} type="card" />
            ))}
          </div>
        ) : animeError && displayAnime.length === 0 ? (
          <div className="error-state">
            <p>Something went wrong loading anime. Please try again.</p>
          </div>
        ) : displayAnime.length > 0 ? (
          <>
            <div className="media-grid">
              {displayAnime.map((anime) => (
                <MediaCard
                  key={anime.id}
                  item={anime}
                  mediaType="anime"
                  platformLabel="MAL"
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
