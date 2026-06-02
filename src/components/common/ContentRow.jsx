import { useRef, useCallback, useState, useEffect, memo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MediaCard from './MediaCard';
import LoadingSkeleton from './LoadingSkeleton';

const SCROLL_AMOUNT = 300;

/**
 * ContentRow – Horizontal scrolling row of MediaCards.
 * Includes section title, optional "See All" link, scroll arrows (desktop),
 * and a loading skeleton state.
 */
function ContentRow({ title, items, mediaType, seeAllLink, isLoading = false }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollability = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    checkScrollability();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScrollability, { passive: true });
      window.addEventListener('resize', checkScrollability);
    }
    return () => {
      if (el) el.removeEventListener('scroll', checkScrollability);
      window.removeEventListener('resize', checkScrollability);
    };
  }, [checkScrollability, items]);

  const scroll = useCallback((direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = direction === 'left' ? -SCROLL_AMOUNT : SCROLL_AMOUNT;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  }, []);

  if (isLoading) {
    return (
      <section className="content-row" aria-label={title || 'Loading content'}>
        <div className="content-row-header">
          <div className="skeleton-shimmer content-row-title-skeleton" />
        </div>
        <LoadingSkeleton type="card" count={6} />
      </section>
    );
  }

  const validItems = Array.isArray(items) ? items : [];
  if (validItems.length === 0 && !title) return null;

  return (
    <section className="content-row" aria-label={title || 'Content row'}>
      <div className="content-row-header">
        {title && <h2 className="content-row-title">{title}</h2>}
        {seeAllLink && (
          <Link to={seeAllLink} className="content-row-see-all" aria-label={`See all ${title || 'items'}`}>
            See All
          </Link>
        )}
      </div>

      <div className="content-row-scroll">
        {canScrollLeft && (
          <button
            className="content-row-arrow content-row-arrow-left"
            onClick={() => scroll('left')}
            aria-label="Scroll left"
          >
            <ChevronLeft size={24} aria-hidden="true" />
          </button>
        )}

        <div className="content-row-items" ref={scrollRef}>
          {validItems.length > 0 ? (
            validItems.map((item, index) => (
              <MediaCard
                key={`${mediaType || item.media_type || item.type || 'item'}-${item.id || item.title || index}-${index}`}
                item={item}
                mediaType={mediaType}
              />
            ))
          ) : (
            <p className="content-row-empty">No items to display.</p>
          )}
        </div>

        {canScrollRight && (
          <button
            className="content-row-arrow content-row-arrow-right"
            onClick={() => scroll('right')}
            aria-label="Scroll right"
          >
            <ChevronRight size={24} aria-hidden="true" />
          </button>
        )}
      </div>
    </section>
  );
}

export default memo(ContentRow);
