import { memo, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getYearFromDate } from '../../utils/helpers';
import { MEDIA_TYPES, TMDB_IMAGE_BASE, POSTER_SIZES } from '../../utils/constants';
import RatingBadge from './RatingBadge';

const FALLBACK_POSTER = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" fill="%2323232e"><rect width="300" height="450"/><text x="150" y="225" text-anchor="middle" fill="%23888" font-size="16" font-family="sans-serif">No Image</text></svg>'
);

/**
 * MediaCard – Reusable content card for movies, TV shows, and anime.
 * Shows poster, title, year, media type badge, and rating.
 */
function MediaCard({ item, mediaType, showRating = true, showYear = true, onClick }) {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick(item);
      return;
    }
    if (!item?.id) return;
    const type = mediaType || item.media_type || item.type || MEDIA_TYPES.MOVIE;
    navigate(`/${type}/${item.id}`, {
      state: {
        fallback: {
          ...item,
          media_type: type,
          type,
        },
      },
    });
  }, [item, mediaType, navigate, onClick]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  if (!item) return null;

  const title = item.title || item.name || 'Untitled';
  const year = getYearFromDate(item.release_date || item.first_air_date);
  const rating = item.vote_average;
  const rawPoster = item.poster_path || item.poster;
  const posterPath = rawPoster
    ? (String(rawPoster).startsWith('http') || String(rawPoster).startsWith('data:')
      ? rawPoster
      : `${TMDB_IMAGE_BASE}/${POSTER_SIZES.MEDIUM}${rawPoster}`)
    : null;
  const displayType = mediaType || item.media_type || item.type || '';
  const typeLabel =
    displayType === MEDIA_TYPES.MOVIE
      ? 'Movie'
      : displayType === MEDIA_TYPES.TV
        ? 'TV'
        : displayType === MEDIA_TYPES.ANIME
          ? 'Anime'
          : '';

  return (
    <article
      className="media-card"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${title}${year ? ` (${year})` : ''}`}
    >
      <div className="media-card-poster">
        <img
          className="media-card-poster-img"
          src={imgError || !posterPath ? FALLBACK_POSTER : posterPath}
          alt={`${title} poster`}
          loading="lazy"
          onError={() => setImgError(true)}
        />
        {showRating && rating != null && rating > 0 && (
          <div className="media-card-rating">
            <RatingBadge rating={rating} size="sm" />
          </div>
        )}
        <div className="media-card-overlay" aria-hidden="true" />
      </div>
      <div className="media-card-info">
        <h3 className="media-card-title">{title}</h3>
        {showYear && year && (
          <p className="media-card-meta">{year}</p>
        )}
      </div>
    </article>
  );
}

export default memo(MediaCard);
