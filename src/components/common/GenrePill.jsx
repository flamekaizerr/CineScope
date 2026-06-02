import { memo } from 'react';

/**
 * GenrePill – Genre tag pill/chip.
 * Supports active state and click handler for filtering.
 */
function GenrePill({ genre, isActive = false, onClick }) {
  if (!genre) return null;

  const label = typeof genre === 'object' ? genre.name : genre;
  const id = typeof genre === 'object' ? genre.id : undefined;

  if (!label) return null;

  const handleClick = () => {
    if (onClick) {
      onClick(typeof genre === 'object' ? genre : { id, name: label });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <span
      className={`genre-pill ${isActive ? 'genre-pill-active' : ''}`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick ? handleClick : undefined}
      onKeyDown={onClick ? handleKeyDown : undefined}
      aria-pressed={onClick ? isActive : undefined}
      aria-label={label}
    >
      {label}
    </span>
  );
}

export default memo(GenrePill);
