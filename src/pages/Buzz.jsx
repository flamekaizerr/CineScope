import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, Eye, Calendar, DollarSign, Film, Tv,
  Users, ChevronRight, Hash
} from 'lucide-react';
import { useApi } from '../hooks/useApi';
import * as trakt from '../services/trakt';
import * as tmdb from '../services/tmdb';
import { formatNumber } from '../utils/helpers';
import MediaCard from '../components/common/MediaCard';
import LoadingSkeleton from '../components/common/LoadingSkeleton';

const CONTENT_TYPES = [
  { key: 'movies', label: 'Movies', icon: Film },
  { key: 'shows', label: 'TV Shows', icon: Tv },
];

function Buzz() {
  const [contentType, setContentType] = useState('movies');

  const {
    data: mostWatched,
    loading: watchedLoading,
    error: watchedError,
  } = useApi(() => trakt.getMostWatched(contentType), [contentType]);

  const {
    data: trending,
    loading: trendingLoading,
    error: trendingError,
  } = useApi(() => trakt.getTrending(contentType), [contentType]);

  const {
    data: anticipated,
    loading: anticipatedLoading,
    error: anticipatedError,
  } = useApi(() => trakt.getAnticipated(contentType), [contentType]);

  const {
    data: boxOffice,
    loading: boxOfficeLoading,
    error: boxOfficeError,
  } = useApi(() => trakt.getBoxOffice(), []);

  const tmdbType = contentType === 'movies' ? 'movie' : 'tv';

  const {
    data: fallbackTrending,
    loading: fallbackTrendingLoading,
  } = useApi(() => tmdb.getTrending(tmdbType, 'week'), [tmdbType]);

  const {
    data: fallbackPopular,
    loading: fallbackPopularLoading,
  } = useApi(() => tmdb.getPopular(tmdbType), [tmdbType]);

  const {
    data: fallbackAnticipated,
    loading: fallbackAnticipatedLoading,
  } = useApi(
    () => (contentType === 'movies' ? tmdb.getUpcoming() : tmdb.getOnTheAir()),
    [contentType]
  );

  const {
    data: fallbackBoxOffice,
    loading: fallbackBoxOfficeLoading,
  } = useApi(() => tmdb.getNowPlaying(), []);

  const normalizeItem = useCallback((item, type) => {
    const media = type === 'movies' ? item.movie : item.show;
    return {
      id: media?.ids?.tmdb,
      title: media?.title || media?.name,
      poster_path: null,
      vote_average: media?.rating ? (media.rating * 10) : null,
      media_type: type === 'movies' ? 'movie' : 'tv',
      release_date: media?.year?.toString(),
      watchers: item.watchers || item.watcher_count || item.list_count,
    };
  }, []);

  const watchedItems = mostWatched?.length
    ? mostWatched.map((item) => normalizeItem(item, contentType)).filter((item) => item.id)
    : (fallbackPopular?.results || []).map((item) => ({ ...item, media_type: tmdbType, watchers: item.popularity }));
  const trendingItems = trending?.length
    ? trending.map((item) => normalizeItem(item, contentType)).filter((item) => item.id)
    : (fallbackTrending?.results || []).map((item) => ({ ...item, media_type: tmdbType, watchers: item.popularity }));
  const anticipatedItems = anticipated?.length
    ? anticipated.map((item) => normalizeItem(item, contentType)).filter((item) => item.id)
    : (fallbackAnticipated?.results || []).map((item) => ({ ...item, media_type: tmdbType, watchers: item.popularity }));
  const boxOfficeItems = boxOffice || [];
  const fallbackBoxOfficeItems = fallbackBoxOffice?.results || [];

  const renderError = (section) => (
    <div className="section-error">
      <p>Failed to load {section}. Please try again later.</p>
    </div>
  );

  return (
    <div className="page buzz-page">
      <div className="page-header">
        <div className="page-title-row">
          <Users size={28} />
          <h1>Community Buzz</h1>
        </div>
        <p className="page-subtitle">
          See what the community is watching, anticipating, and talking about.
        </p>

        {/* Content Type Toggle */}
        <div className="tabs">
          {CONTENT_TYPES.map((type) => (
            <button
              key={type.key}
              className={`tab ${contentType === type.key ? 'tab-active' : ''}`}
              onClick={() => setContentType(type.key)}
            >
              <type.icon size={14} />
              {type.label}
            </button>
          ))}
        </div>
      </div>

      <div className="page-content">
        {/* Most Watched This Week */}
        <section className="section">
          <div className="section-header">
            <div className="section-title">
              <Eye size={20} />
              <h2>Most Watched This Week</h2>
            </div>
          </div>
          {watchedLoading || fallbackPopularLoading ? (
            <LoadingSkeleton type="row" count={6} />
          ) : watchedError ? (
            renderError('most watched')
          ) : watchedItems.length > 0 ? (
            <div className="buzz-grid">
              {watchedItems.slice(0, 12).map((item, index) => (
                <div key={`watched-${item.id || index}`} className="buzz-card">
                  <span className="buzz-rank">{index + 1}</span>
                  <MediaCard item={item} mediaType={item.media_type} compact />
                  {item.watchers && (
                    <span className="buzz-watchers">
                      <Eye size={12} /> {formatNumber(item.watchers)} watchers
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-message">No data available for this week.</p>
          )}
        </section>

        {/* Trending in Community */}
        <section className="section">
          <div className="section-header">
            <div className="section-title">
              <TrendingUp size={20} />
              <h2>Trending in Community</h2>
            </div>
          </div>
          {trendingLoading || fallbackTrendingLoading ? (
            <LoadingSkeleton type="row" count={6} />
          ) : trendingError ? (
            renderError('community trends')
          ) : trendingItems.length > 0 ? (
            <div className="buzz-grid">
              {trendingItems.slice(0, 12).map((item, index) => (
                <div key={`trending-${item.id || index}`} className="buzz-card">
                  <span className="buzz-rank">{index + 1}</span>
                  <MediaCard item={item} mediaType={item.media_type} compact />
                  {item.watchers && (
                    <span className="buzz-watchers">
                      <Users size={12} /> {formatNumber(item.watchers)} watching
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-message">No community trends available.</p>
          )}
        </section>

        {/* Most Anticipated */}
        <section className="section">
          <div className="section-header">
            <div className="section-title">
              <Calendar size={20} />
              <h2>Most Anticipated</h2>
            </div>
          </div>
          {anticipatedLoading || fallbackAnticipatedLoading ? (
            <LoadingSkeleton type="row" count={6} />
          ) : anticipatedError ? (
            renderError('anticipated titles')
          ) : anticipatedItems.length > 0 ? (
            <div className="buzz-grid">
              {anticipatedItems.slice(0, 12).map((item, index) => (
                <div key={`anticipated-${item.id || index}`} className="buzz-card">
                  <span className="buzz-rank">{index + 1}</span>
                  <MediaCard item={item} mediaType={item.media_type} compact />
                  {item.watchers && (
                    <span className="buzz-watchers">
                      <Users size={12} /> {formatNumber(item.watchers)} lists
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-message">No anticipated titles available.</p>
          )}
        </section>

        {/* Weekend Box Office */}
        <section className="section">
          <div className="section-header">
            <div className="section-title">
              <DollarSign size={20} />
              <h2>Weekend Box Office</h2>
            </div>
          </div>
          {boxOfficeLoading || fallbackBoxOfficeLoading ? (
            <LoadingSkeleton type="list" count={10} />
          ) : boxOfficeError ? (
            renderError('box office')
          ) : boxOfficeItems.length > 0 ? (
            <div className="box-office-list">
              {boxOfficeItems.map((item, index) => {
                const movie = item.movie;
                return (
                  <Link
                    key={movie?.ids?.tmdb || index}
                    to={`/movie/${movie?.ids?.tmdb}`}
                    className="box-office-item"
                  >
                    <span className="box-office-rank">
                      <Hash size={14} />{index + 1}
                    </span>
                    <div className="box-office-info">
                      <span className="box-office-title">{movie?.title}</span>
                      <span className="box-office-year">{movie?.year}</span>
                    </div>
                    <div className="box-office-revenue">
                      <DollarSign size={14} />
                      <span>{item.revenue ? `$${formatNumber(item.revenue)}` : 'N/A'}</span>
                    </div>
                    <ChevronRight size={16} className="box-office-arrow" />
                  </Link>
                );
              })}
            </div>
          ) : fallbackBoxOfficeItems.length > 0 ? (
            <div className="box-office-list">
              {fallbackBoxOfficeItems.slice(0, 10).map((movie, index) => (
                <Link
                  key={movie.id}
                  to={`/movie/${movie.id}`}
                  className="box-office-item"
                >
                  <span className="box-office-rank">
                    <Hash size={14} />{index + 1}
                  </span>
                  <div className="box-office-info">
                    <span className="box-office-title">{movie.title}</span>
                    <span className="box-office-year">{movie.release_date?.slice(0, 4)}</span>
                  </div>
                  <div className="box-office-revenue">
                    <DollarSign size={14} />
                    <span>Hot in theaters</span>
                  </div>
                  <ChevronRight size={16} className="box-office-arrow" />
                </Link>
              ))}
            </div>
          ) : (
            <p className="empty-message">No box office data available for this week.</p>
          )}
        </section>
      </div>
    </div>
  );
}

export default Buzz;
