/**
 * @file Application-wide constants for CineScope.
 */

/** Supported media types */
export const MEDIA_TYPES = Object.freeze({
  MOVIE: 'movie',
  TV: 'tv',
  ANIME: 'anime',
});

/** User list / tracking categories */
export const LIST_TYPES = Object.freeze({
  WATCHLIST: 'watchlist',
  WATCHING: 'watching',
  COMPLETED: 'completed',
  DROPPED: 'dropped',
});

/** Trending time windows */
export const TIME_WINDOWS = Object.freeze({
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
});

/** TMDB movie genres */
export const MOVIE_GENRES = Object.freeze({
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Science Fiction',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
});

/** TMDB TV genres */
export const TV_GENRES = Object.freeze({
  10759: 'Action & Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  10762: 'Kids',
  9648: 'Mystery',
  10763: 'News',
  10764: 'Reality',
  10765: 'Sci-Fi & Fantasy',
  10766: 'Soap',
  10767: 'Talk',
  10768: 'War & Politics',
  37: 'Western',
});

/** Jikan / MAL anime genres (subset of most common) */
export const ANIME_GENRES = Object.freeze({
  1: 'Action',
  2: 'Adventure',
  4: 'Comedy',
  8: 'Drama',
  10: 'Fantasy',
  14: 'Horror',
  7: 'Mystery',
  22: 'Romance',
  24: 'Sci-Fi',
  36: 'Slice of Life',
  30: 'Sports',
  37: 'Supernatural',
  41: 'Thriller',
  25: 'Shoujo',
  27: 'Shounen',
  42: 'Seinen',
  43: 'Josei',
  15: 'Kids',
  38: 'Military',
  19: 'Music',
  40: 'Psychological',
  23: 'School',
  29: 'Space',
  26: 'Girls Love',
  28: 'Boys Love',
  11: 'Game',
  13: 'Historical',
  17: 'Martial Arts',
  18: 'Mecha',
  35: 'Harem',
  39: 'Detective',
  6: 'Demons',
  5: 'Avant Garde',
  46: 'Award Winning',
  47: 'Gourmet',
  48: 'Work Life',
});

/** Combined genre lookup keyed by media type */
export const GENRES = Object.freeze({
  [MEDIA_TYPES.MOVIE]: MOVIE_GENRES,
  [MEDIA_TYPES.TV]: TV_GENRES,
  [MEDIA_TYPES.ANIME]: ANIME_GENRES,
});

/** Sort / order options used across discovery screens */
export const SORT_OPTIONS = Object.freeze({
  POPULARITY_DESC: 'popularity.desc',
  POPULARITY_ASC: 'popularity.asc',
  VOTE_AVERAGE_DESC: 'vote_average.desc',
  VOTE_AVERAGE_ASC: 'vote_average.asc',
  RELEASE_DATE_DESC: 'primary_release_date.desc',
  RELEASE_DATE_ASC: 'primary_release_date.asc',
  REVENUE_DESC: 'revenue.desc',
  TITLE_ASC: 'original_title.asc',
  TITLE_DESC: 'original_title.desc',
});

/** Default region for watch providers and certifications */
export const DEFAULT_REGION = 'US';

/** TMDB image base URL and preset sizes */
export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export const POSTER_SIZES = Object.freeze({
  TINY: 'w92',
  SMALL: 'w185',
  MEDIUM: 'w342',
  LARGE: 'w500',
  XLARGE: 'w780',
  ORIGINAL: 'original',
});

export const BACKDROP_SIZES = Object.freeze({
  SMALL: 'w300',
  MEDIUM: 'w780',
  LARGE: 'w1280',
  ORIGINAL: 'original',
});

export const PROFILE_SIZES = Object.freeze({
  SMALL: 'w45',
  MEDIUM: 'w185',
  LARGE: 'h632',
  ORIGINAL: 'original',
});

/** Cache TTL defaults (milliseconds) */
export const CACHE_TTL = Object.freeze({
  SHORT: 5 * 60 * 1000, // 5 minutes
  MEDIUM: 30 * 60 * 1000, // 30 minutes
  LONG: 60 * 60 * 1000, // 1 hour
});

/** Maximum items per user list */
export const MAX_LIST_SIZE = 10_000;

/** Debounce delay for search input (ms) */
export const SEARCH_DEBOUNCE_MS = 400;

/** Sync debounce delay for Google Drive (ms) */
export const SYNC_DEBOUNCE_MS = 3000;
