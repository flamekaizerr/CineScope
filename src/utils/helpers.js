/**
 * @file Utility / helper functions for CineScope.
 */

/**
 * Format a date string into a human-readable format.
 * @param {string|Date} dateStr - ISO date string, YYYY-MM-DD, or Date object
 * @param {Intl.DateTimeFormatOptions} [options] - formatting options
 * @returns {string} formatted date or 'Unknown'
 */
export function formatDate(
  dateStr,
  options = { year: 'numeric', month: 'short', day: 'numeric' },
) {
  if (!dateStr) return 'Unknown';
  try {
    const date = dateStr instanceof Date ? dateStr : new Date(dateStr);
    if (isNaN(date.getTime())) return 'Unknown';
    return date.toLocaleDateString('en-US', options);
  } catch {
    return 'Unknown';
  }
}

/**
 * Format runtime minutes into a human-friendly string.
 * @param {number} minutes - total minutes
 * @returns {string} e.g. "2h 15m"
 */
export function formatRuntime(minutes) {
  if (!minutes || minutes <= 0) return 'N/A';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Format a rating value to one decimal place.
 * @param {number} rating
 * @returns {string} e.g. "7.4" or "N/A"
 */
export function formatRating(rating) {
  if (rating == null || isNaN(rating)) return 'N/A';
  return Number(rating).toFixed(1);
}

/**
 * Format large numbers into compact human-readable strings.
 * @param {number} num
 * @returns {string} e.g. "1.2M", "845K", "320"
 */
export function formatNumber(num) {
  if (num == null || isNaN(num)) return '0';
  const n = Number(num);
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}

/**
 * Extract the four-digit year from a date string.
 * @param {string} dateStr
 * @returns {string} e.g. "2024" or ""
 */
export function getYearFromDate(dateStr) {
  if (!dateStr) return '';
  const match = String(dateStr).match(/(\d{4})/);
  return match ? match[1] : '';
}

/**
 * Truncate text to a given length, appending an ellipsis character.
 * @param {string} text
 * @param {number} [maxLength=150]
 * @returns {string}
 */
export function truncateText(text, maxLength = 150) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}

/**
 * Determine the media type of an item by inspecting its properties.
 * TMDB movies have `title`; TV shows have `name` and `first_air_date`;
 * Anime items from Jikan have `mal_id`.
 * @param {object} item
 * @returns {'movie'|'tv'|'anime'|'unknown'}
 */
export function getMediaType(item) {
  if (!item) return 'unknown';
  // Explicit type from our own data
  if (item.mediaType) return item.mediaType;
  if (item.media_type) return item.media_type;
  // Jikan / MAL anime
  if (item.mal_id) return 'anime';
  // TMDB TV
  if (item.first_air_date || item.name) return 'tv';
  // TMDB Movie
  if (item.release_date || item.title) return 'movie';
  return 'unknown';
}

/**
 * Generate a unique ID string (UUID v4-like).
 * @returns {string}
 */
export function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Create a debounced version of a function.
 * @param {Function} fn - function to debounce
 * @param {number} delay - delay in milliseconds
 * @returns {Function} debounced function with a `.cancel()` method
 */
export function debounce(fn, delay) {
  let timerId = null;

  const debounced = (...args) => {
    if (timerId !== null) clearTimeout(timerId);
    timerId = setTimeout(() => {
      timerId = null;
      fn(...args);
    }, delay);
  };

  debounced.cancel = () => {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  return debounced;
}

/**
 * Return a Promise that resolves after the given number of milliseconds.
 * @param {number} ms
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
