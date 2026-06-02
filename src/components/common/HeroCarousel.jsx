import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { truncateText, getYearFromDate } from '../../utils/helpers';
import { TMDB_IMAGE_BASE, BACKDROP_SIZES } from '../../utils/constants';
import RatingBadge from './RatingBadge';
import GenrePill from './GenrePill';

const AUTO_ROTATE_INTERVAL = 6000;

/**
 * HeroCarousel – Full-width hero banner carousel for trending items.
 * Auto-rotates every 6s with manual navigation via dots and arrows.
 */
function HeroCarousel({ items }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef(null);

  const validItems = Array.isArray(items) && items.length > 0 ? items : [];
  const total = validItems.length;

  // Auto-rotate
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (total > 1) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % total);
      }, AUTO_ROTATE_INTERVAL);
    }
  }, [total]);

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [resetTimer]);

  const goTo = useCallback(
    (index) => {
      setCurrentIndex(index);
      resetTimer();
    },
    [resetTimer]
  );

  const goNext = useCallback(() => {
    goTo((currentIndex + 1) % total);
  }, [currentIndex, total, goTo]);

  const goPrev = useCallback(() => {
    goTo((currentIndex - 1 + total) % total);
  }, [currentIndex, total, goTo]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
    },
    [goNext, goPrev]
  );

  if (total === 0) return null;

  const currentItem = validItems[currentIndex];
  const backdropUrl = currentItem?.backdrop_path
    ? `${TMDB_IMAGE_BASE}/${BACKDROP_SIZES.LARGE}${currentItem.backdrop_path}`
    : null;
  const title = currentItem?.title || currentItem?.name || 'Untitled';
  const overview = truncateText(currentItem?.overview, 200);
  const year = getYearFromDate(currentItem?.release_date || currentItem?.first_air_date);
  const rating = currentItem?.vote_average;
  const mediaType = currentItem?.media_type || 'movie';
  const genres = currentItem?.genre_ids_names || currentItem?.genres || [];

  return (
    <section
      className="hero-carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label="Trending content"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="hero-slide" aria-live="polite">
        {backdropUrl ? (
          <div
            className="hero-backdrop"
            style={{ backgroundImage: `url(${backdropUrl})` }}
            role="img"
            aria-label={`${title} backdrop`}
          />
        ) : (
          <div className="hero-backdrop hero-backdrop-fallback" role="img" aria-label="No image available" />
        )}
        <div className="hero-gradient" aria-hidden="true" />

        <div className="hero-content">
          <h2 className="hero-title">{title}</h2>

          <div className="hero-meta">
            {rating != null && rating > 0 && (
              <RatingBadge rating={rating} size="md" source="tmdb" />
            )}
            {year && <span className="hero-year">{year}</span>}
          </div>

          {genres.length > 0 && (
            <div className="hero-genres">
              {genres.slice(0, 4).map((g, i) => (
                <GenrePill key={g.id || g.name || i} genre={g} />
              ))}
            </div>
          )}

          {overview && <p className="hero-overview">{overview}</p>}

          <div className="hero-actions">
            <Link
              to={`/${mediaType}/${currentItem?.id}`}
              state={{
                fallback: {
                  ...currentItem,
                  media_type: mediaType,
                  type: mediaType,
                },
              }}
              className="hero-btn hero-btn-primary"
            >
              <Info size={18} aria-hidden="true" />
              More Info
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation arrows */}
      {total > 1 && (
        <>
          <button
            className="hero-arrow hero-arrow-left"
            onClick={goPrev}
            aria-label="Previous slide"
          >
            <ChevronLeft size={28} aria-hidden="true" />
          </button>
          <button
            className="hero-arrow hero-arrow-right"
            onClick={goNext}
            aria-label="Next slide"
          >
            <ChevronRight size={28} aria-hidden="true" />
          </button>
        </>
      )}

      {/* Navigation dots */}
      {total > 1 && (
        <div className="hero-dots" role="tablist" aria-label="Slide navigation">
          {validItems.map((_, i) => (
            <button
              key={i}
              className={`hero-dot ${i === currentIndex ? 'hero-dot-active' : ''}`}
              onClick={() => goTo(i)}
              role="tab"
              aria-selected={i === currentIndex}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default memo(HeroCarousel);
