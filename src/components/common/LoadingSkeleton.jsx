import { memo } from 'react';

/**
 * LoadingSkeleton – Animated loading placeholder.
 * Types: card, row, detail, text, circle.
 * Renders `count` instances for repeatable shapes.
 */
function LoadingSkeleton({ type = 'text', count = 1 }) {
  const items = Array.from({ length: count }, (_, i) => i);

  switch (type) {
    case 'card':
      return (
        <div className="skeleton-row" role="status" aria-label="Loading content">
          {items.map((i) => (
            <div key={i} className="skeleton skeleton-card">
              <div className="skeleton-shimmer skeleton-card-poster" />
              <div className="skeleton-shimmer skeleton-card-title" />
              <div className="skeleton-shimmer skeleton-card-meta" />
            </div>
          ))}
        </div>
      );

    case 'row':
      return (
        <div className="skeleton-section" role="status" aria-label="Loading content">
          <div className="skeleton-shimmer skeleton-row-title" />
          <div className="skeleton-row">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="skeleton skeleton-card">
                <div className="skeleton-shimmer skeleton-card-poster" />
                <div className="skeleton-shimmer skeleton-card-title" />
              </div>
            ))}
          </div>
        </div>
      );

    case 'detail':
      return (
        <div className="skeleton-detail" role="status" aria-label="Loading details">
          <div className="skeleton-shimmer skeleton-detail-backdrop" />
          <div className="skeleton-detail-body">
            <div className="skeleton-shimmer skeleton-detail-poster" />
            <div className="skeleton-detail-info">
              <div className="skeleton-shimmer skeleton-detail-title" />
              <div className="skeleton-shimmer skeleton-text skeleton-text-lg" />
              <div className="skeleton-shimmer skeleton-text skeleton-text-lg" />
              <div className="skeleton-shimmer skeleton-text skeleton-text-md" />
              <div className="skeleton-shimmer skeleton-text skeleton-text-sm" />
            </div>
          </div>
        </div>
      );

    case 'circle':
      return (
        <div className="skeleton-circles" role="status" aria-label="Loading content">
          {items.map((i) => (
            <div key={i} className="skeleton-shimmer skeleton-circle" />
          ))}
        </div>
      );

    case 'text':
    default:
      return (
        <div className="skeleton-texts" role="status" aria-label="Loading text">
          {items.map((i) => (
            <div
              key={i}
              className="skeleton-shimmer skeleton-text"
              /* Vary widths for a realistic look */
              style={{ width: `${70 + Math.random() * 30}%` }}
            />
          ))}
        </div>
      );
  }
}

export default memo(LoadingSkeleton);
