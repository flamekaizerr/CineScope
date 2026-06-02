/**
 * @file Trakt API service for CineScope.
 * Routes through /api/trakt serverless proxy in production to keep keys safe.
 */

import config from '../config/api.js';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Generic Trakt fetch wrapper — uses proxy or direct depending on config.
 * @param {string} path
 * @param {Record<string, string|number>} [params={}]
 * @returns {Promise<any>}
 */
async function traktFetch(path, params = {}) {
  let url;
  let fetchOptions = {};

  if (config.useDirectApi) {
    // Direct mode — key sent in headers
    url = new URL(`${config.trakt.baseUrl}${path}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
    fetchOptions = {
      headers: {
        'Content-Type': 'application/json',
        'trakt-api-version': config.trakt.apiVersion,
        'trakt-api-key': config.trakt.apiKey,
      },
    };
  } else {
    // Proxy mode — key added server-side
    url = new URL(config.trakt.proxyPath, window.location.origin);
    url.searchParams.set('path', path);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const response = await fetch(url.toString(), fetchOptions);

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(
      `Trakt request failed (${response.status}): ${errorBody}`.trim(),
    );
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// Trending
// ---------------------------------------------------------------------------

/**
 * Get trending movies or shows on Trakt.
 * @param {'movies'|'shows'} [type='movies']
 * @param {number} [page=1]
 * @param {number} [limit=20]
 * @returns {Promise<any[]>}
 */
export async function getTrending(type = 'movies', page = 1, limit = 20) {
  try {
    return await traktFetch(`/${type}/trending`, { page, limit, extended: 'full' });
  } catch (error) {
    console.error('[Trakt] getTrending failed:', error.message);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Most Watched
// ---------------------------------------------------------------------------

/**
 * Get the most-watched movies or shows for a time period.
 * @param {'movies'|'shows'} [type='movies']
 * @param {'weekly'|'monthly'|'yearly'|'all'} [period='weekly']
 * @param {number} [page=1]
 * @param {number} [limit=20]
 * @returns {Promise<any[]>}
 */
export async function getMostWatched(type = 'movies', period = 'weekly', page = 1, limit = 20) {
  try {
    return await traktFetch(`/${type}/watched/${period}`, {
      page,
      limit,
      extended: 'full',
    });
  } catch (error) {
    console.error('[Trakt] getMostWatched failed:', error.message);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Most Played
// ---------------------------------------------------------------------------

/**
 * Get the most-played movies or shows for a time period.
 * @param {'movies'|'shows'} [type='movies']
 * @param {'weekly'|'monthly'|'yearly'|'all'} [period='weekly']
 * @param {number} [page=1]
 * @param {number} [limit=20]
 * @returns {Promise<any[]>}
 */
export async function getMostPlayed(type = 'movies', period = 'weekly', page = 1, limit = 20) {
  try {
    return await traktFetch(`/${type}/played/${period}`, {
      page,
      limit,
      extended: 'full',
    });
  } catch (error) {
    console.error('[Trakt] getMostPlayed failed:', error.message);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Popular
// ---------------------------------------------------------------------------

/**
 * Get popular movies or shows.
 * @param {'movies'|'shows'} [type='movies']
 * @param {number} [page=1]
 * @param {number} [limit=20]
 * @returns {Promise<any[]>}
 */
export async function getPopular(type = 'movies', page = 1, limit = 20) {
  try {
    return await traktFetch(`/${type}/popular`, { page, limit, extended: 'full' });
  } catch (error) {
    console.error('[Trakt] getPopular failed:', error.message);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Anticipated
// ---------------------------------------------------------------------------

/**
 * Get the most-anticipated movies or shows.
 * @param {'movies'|'shows'} [type='movies']
 * @param {number} [page=1]
 * @param {number} [limit=20]
 * @returns {Promise<any[]>}
 */
export async function getAnticipated(type = 'movies', page = 1, limit = 20) {
  try {
    return await traktFetch(`/${type}/anticipated`, {
      page,
      limit,
      extended: 'full',
    });
  } catch (error) {
    console.error('[Trakt] getAnticipated failed:', error.message);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Box Office
// ---------------------------------------------------------------------------

/**
 * Get the weekend box office results (movies only).
 * @returns {Promise<any[]>}
 */
export async function getBoxOffice() {
  try {
    return await traktFetch('/movies/boxoffice', { extended: 'full' });
  } catch (error) {
    console.error('[Trakt] getBoxOffice failed:', error.message);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Default export
// ---------------------------------------------------------------------------

const traktService = {
  getTrending,
  getMostWatched,
  getMostPlayed,
  getPopular,
  getAnticipated,
  getBoxOffice,
};

export default traktService;
