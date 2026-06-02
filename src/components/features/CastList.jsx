import { useRef, useCallback, memo, useState } from 'react';
import { ChevronLeft, ChevronRight, User } from 'lucide-react';

const TMDB_PROFILE_BASE = 'https://image.tmdb.org/t/p/w185';

/**
 * CastList – Horizontal scrolling cast/crew list with circular photos.
 */
function CastList({ cast }) {
  const scrollRef = useRef(null);
  const [imgErrors, setImgErrors] = useState({});

  const validCast = Array.isArray(cast) ? cast : [];

  const scroll = useCallback((direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = direction === 'left' ? -250 : 250;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  }, []);

  const handleImgError = useCallback((id) => {
    setImgErrors((prev) => ({ ...prev, [id]: true }));
  }, []);

  if (validCast.length === 0) {
    return (
      <section className="cast-list" aria-label="Cast">
        <p className="cast-list-empty">No cast information available.</p>
      </section>
    );
  }

  return (
    <section className="cast-list" aria-label="Cast">
      <div className="cast-list-controls">
        <button
          className="cast-list-arrow cast-list-arrow-left"
          onClick={() => scroll('left')}
          aria-label="Scroll cast left"
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <button
          className="cast-list-arrow cast-list-arrow-right"
          onClick={() => scroll('right')}
          aria-label="Scroll cast right"
        >
          <ChevronRight size={20} aria-hidden="true" />
        </button>
      </div>

      <div className="cast-list-scroll" ref={scrollRef}>
        {validCast.map((member, index) => {
          const key = member.cast_id ?? member.credit_id ?? member.id ?? `cast-${index}`;
          const hasError = imgErrors[key];
          const hasPhoto = member.profile_path && !hasError;

          return (
            <div className="cast-member" key={key}>
              <div className="cast-photo-wrapper">
                {hasPhoto ? (
                  <img
                    className="cast-photo"
                    src={`${TMDB_PROFILE_BASE}${member.profile_path}`}
                    alt={member.name || 'Cast member'}
                    loading="lazy"
                    onError={() => handleImgError(key)}
                  />
                ) : (
                  <div className="cast-photo cast-photo-fallback" aria-hidden="true">
                    <User size={28} />
                  </div>
                )}
              </div>
              <p className="cast-name">{member.name || 'Unknown'}</p>
              {member.character && (
                <p className="cast-character">{member.character}</p>
              )}
              {member.job && !member.character && (
                <p className="cast-character">{member.job}</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default memo(CastList);
