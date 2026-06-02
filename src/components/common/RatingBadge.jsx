import { memo } from 'react';
import { formatRating } from '../../utils/helpers';

/**
 * RatingBadge – Circular badge showing a rating score with color coding.
 * Green (≥7.0), yellow/amber (5.0-6.9), red (<5.0).
 */
function RatingBadge({ rating, size = 'md', source }) {
  if (rating == null || isNaN(rating)) return null;

  const numRating = Number(rating);
  const colorClass =
    numRating >= 7.0
      ? 'rating-high'
      : numRating >= 5.0
        ? 'rating-mid'
        : 'rating-low';

  const sizeClass =
    size === 'sm'
      ? 'rating-badge-sm'
      : size === 'lg'
        ? 'rating-badge-lg'
        : 'rating-badge-md';

  return (
    <div
      className={`rating-badge ${sizeClass} ${colorClass}`}
      aria-label={`Rating: ${formatRating(numRating)} out of 10${source ? ` on ${source.toUpperCase()}` : ''}`}
      title={`${formatRating(numRating)}${source ? ` (${source.toUpperCase()})` : ''}`}
    >
      <span className="rating-badge-score">{formatRating(numRating)}</span>
      {source && <span className="rating-badge-source">{source.toUpperCase()}</span>}
    </div>
  );
}

export default memo(RatingBadge);
