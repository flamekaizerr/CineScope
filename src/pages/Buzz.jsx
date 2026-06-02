import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, Eye, Calendar, DollarSign, Film, Tv,
  Users, Trophy, ChevronRight, Hash
} from 'lucide-react';
import { useApi } from '../hooks/useApi';
import * as trakt from '../services/trakt';
import { formatNumber } from '../utils/helpers';
import MediaCard from '../components/common/MediaCard';
import ContentRow from '../components/common/ContentRow';
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

  const watchedItems = mostWatched?.map((item) => normalizeItem(item, contentType)) || [];
  const trendingItems = trending?.map((item) => normalizeItem(item, contentType)) || [];
  const anticipatedItems = anticipated?.map((item) => normalizeItem(item, contentType)) || [];
  const boxOfficeItems = boxOffice || [];

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
          {watchedLoading ? (
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
          {trendingLoading ? (
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
          {anticipatedLoading ? (
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
          {boxOfficeLoading ? (
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
          ) : (
            <p className="empty-message">No box office data available for this week.</p>
          )}
        </section>
      </div>
    </div>
  );
}

export default Buzz;
