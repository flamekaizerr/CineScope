/**
 * @file Jikan (MyAnimeList unofficial API) service for CineScope.
 * Includes a built-in request queue to respect the 3 req/s rate limit.
 */

import config from '../config/api.js';

// ---------------------------------------------------------------------------
// Rate-limiter / request queue
// ---------------------------------------------------------------------------

/** Timestamps of recent requests (kept to enforce rate limit). */
const requestTimestamps = [];

/**
 * Wait if necessary so that we never exceed the Jikan rate limit.
 * @returns {Promise<void>}
 */
async function enforceRateLimit() {
  const now = Date.now();
  // Remove timestamps older than 1 second
  while (requestTimestamps.length > 0 && now - requestTimestamps[0] > 1000) {
    requestTimestamps.shift();
  }
  if (requestTimestamps.length >= config.jikan.rateLimit) {
    const oldestInWindow = requestTimestamps[0];
    const waitMs = 1000 - (now - oldestInWindow) + 50; // +50ms safety margin
    if (waitMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
  requestTimestamps.push(Date.now());
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Build a full Jikan API URL with query parameters.
 * @param {string} path
 * @param {Record<string, string|number>} [params={}]
 * @returns {string}
 */
function buildUrl(path, params = {}) {
  const url = new URL(`${config.jikan.baseUrl}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}

/**
 * Generic Jikan fetch wrapper with rate-limiting and error handling.
 * @param {string} path
 * @param {Record<string, string|number>} [params={}]
 * @returns {Promise<any>}
 */
async function jikanFetch(path, params = {}) {
  await enforceRateLimit();

  const url = buildUrl(path, params);
  const response = await fetch(url);

  // Jikan returns 429 when rate-limited — back off and retry once
  if (response.status === 429) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await enforceRateLimit();
    const retryResponse = await fetch(url);
    if (!retryResponse.ok) {
      throw new Error(`Jikan request failed after retry (${retryResponse.status})`);
    }
    return retryResponse.json();
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody?.message || `Jikan request failed (${response.status})`;
    throw new Error(message);
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// Top Anime
// ---------------------------------------------------------------------------

/**
 * Get top anime with an optional filter.
 * @param {'airing'|'upcoming'|'bypopularity'|'favorite'} [filter]
 * @param {number} [page=1]
 * @returns {Promise<{data: any[], pagination: object}>}
 */
export async function getTopAnime(filter, page = 1) {
  try {
    const params = { page };
    if (filter) params.filter = filter;
    return await jikanFetch('/top/anime', params);
  } catch (error) {
    console.error('[Jikan] getTopAnime failed:', error.message);
    return { data: [], pagination: {} };
  }
}

// ---------------------------------------------------------------------------
// Seasonal
// ---------------------------------------------------------------------------

/**
 * Get anime airing in the current season.
 * @param {number} [page=1]
 * @returns {Promise<{data: any[], pagination: object}>}
 */
export async function getSeasonNow(page = 1) {
  try {
    return await jikanFetch('/seasons/now', { page });
  } catch (error) {
    console.error('[Jikan] getSeasonNow failed:', error.message);
    return { data: [], pagination: {} };
  }
}

/**
 * Get anime scheduled for the upcoming season.
 * @param {number} [page=1]
 * @returns {Promise<{data: any[], pagination: object}>}
 */
export async function getSeasonUpcoming(page = 1) {
  try {
    return await jikanFetch('/seasons/upcoming', { page });
  } catch (error) {
    console.error('[Jikan] getSeasonUpcoming failed:', error.message);
    return { data: [], pagination: {} };
  }
}

// ---------------------------------------------------------------------------
// Details & Related
// ---------------------------------------------------------------------------

/**
 * Get full details for a specific anime.
 * @param {number|string} id - MAL anime ID
 * @returns {Promise<object|null>}
 */
export async function getAnimeDetails(id) {
  try {
    const response = await jikanFetch(`/anime/${id}/full`);
    return response?.data ?? null;
  } catch (error) {
    console.error('[Jikan] getAnimeDetails failed:', error.message);
    return null;
  }
}

/**
 * Get characters for a specific anime.
 * @param {number|string} id - MAL anime ID
 * @returns {Promise<any[]>}
 */
export async function getAnimeCharacters(id) {
  try {
    const response = await jikanFetch(`/anime/${id}/characters`);
    return response?.data ?? [];
  } catch (error) {
    console.error('[Jikan] getAnimeCharacters failed:', error.message);
    return [];
  }
}

/**
 * Get recommendations related to a specific anime.
 * @param {number|string} id - MAL anime ID
 * @returns {Promise<any[]>}
 */
export async function getAnimeRecommendations(id) {
  try {
    const response = await jikanFetch(`/anime/${id}/recommendations`);
    return response?.data ?? [];
  } catch (error) {
    console.error('[Jikan] getAnimeRecommendations failed:', error.message);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

/**
 * Search for anime by title.
 * @param {string} query
 * @param {number} [page=1]
 * @returns {Promise<{data: any[], pagination: object}>}
 */
export async function searchAnime(query, page = 1) {
  if (!query || !query.trim()) {
    return { data: [], pagination: {} };
  }
  try {
    return await jikanFetch('/anime', { q: query.trim(), page, sfw: true });
  } catch (error) {
    console.error('[Jikan] searchAnime failed:', error.message);
    return { data: [], pagination: {} };
  }
}

// ---------------------------------------------------------------------------
// By Genre
// ---------------------------------------------------------------------------

/**
 * Get anime filtered by genre.
 * @param {number|string} genreId - MAL genre ID
 * @param {number} [page=1]
 * @returns {Promise<{data: any[], pagination: object}>}
 */
export async function getAnimeByGenre(genreId, page = 1) {
  try {
    return await jikanFetch('/anime', {
      genres: genreId,
      order_by: 'score',
      sort: 'desc',
      page,
      sfw: true,
    });
  } catch (error) {
    console.error('[Jikan] getAnimeByGenre failed:', error.message);
    return { data: [], pagination: {} };
  }
}

export async function browseAnime({
  tab = 'season',
  page = 1,
  genres = [],
  format = 'all',
  timeWindow = 'all',
} = {}) {
  try {
    if (tab === 'season' && genres.length === 0 && format === 'all' && timeWindow !== 'month') {
      return getSeasonNow(page);
    }
    if (tab === 'upcoming' && genres.length === 0 && format === 'all') {
      return getSeasonUpcoming(page);
    }
    const params = {
      page,
      sfw: true,
      order_by: tab === 'popular' ? 'popularity' : 'score',
      sort: 'desc',
      genres: genres.length ? genres.join(',') : undefined,
      type: format !== 'all' ? format : undefined,
      status: tab === 'airing' || timeWindow === 'today' || timeWindow === 'week' ? 'airing' : undefined,
    };
    return await jikanFetch('/anime', params);
  } catch (error) {
    console.error('[Jikan] browseAnime failed:', error.message);
    return { data: [], pagination: {} };
  }
}

// ---------------------------------------------------------------------------
// Genres
// ---------------------------------------------------------------------------

/**
 * Get the list of anime genres from Jikan.
 * @returns {Promise<Array<{mal_id: number, name: string, count: number}>>}
 */
export async function getAnimeGenres() {
  try {
    const response = await jikanFetch('/genres/anime');
    return response?.data ?? [];
  } catch (error) {
    console.error('[Jikan] getAnimeGenres failed:', error.message);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Convenience aliases used by page components
// ---------------------------------------------------------------------------

/** Alias for getTopAnime('airing') used by Anime page. */
export async function getTopAiring(page = 1) {
  return getTopAnime('airing', page);
}

/** Alias for getSeasonUpcoming() used by Anime page. */
export const getUpcomingAnime = getSeasonUpcoming;

/** Alias for getAnimeDetails() used by AnimeDetail page. */
export const getAnimeById = getAnimeDetails;

/**
 * Get statistics for a specific anime.
 * @param {number|string} id - MAL anime ID
 * @returns {Promise<object|null>}
 */
export async function getAnimeStatistics(id) {
  try {
    const response = await jikanFetch(`/anime/${id}/statistics`);
    return response?.data ?? null;
  } catch (error) {
    console.error('[Jikan] getAnimeStatistics failed:', error.message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Default export
// ---------------------------------------------------------------------------

const jikanService = {
  getTopAnime,
  getTopAiring,
  getSeasonNow,
  getSeasonUpcoming,
  getUpcomingAnime,
  getAnimeDetails,
  getAnimeById,
  getAnimeCharacters,
  getAnimeRecommendations,
  getAnimeStatistics,
  searchAnime,
  getAnimeByGenre,
  getAnimeGenres,
  browseAnime,
};

export default jikanService;
