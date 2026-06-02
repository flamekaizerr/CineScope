/**
 * @file TMDB (The Movie Database) API service for CineScope.
 * Routes through /api/tmdb serverless proxy in production to keep keys safe.
 */

import config from '../config/api.js';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Build the fetch URL — either proxy or direct depending on config.
 * @param {string} path - API path (e.g. '/movie/popular')
 * @param {Record<string, string|number>} [params={}]
 * @returns {string}
 */
function buildUrl(path, params = {}) {
  if (config.useDirectApi) {
    // Direct mode (local dev only) — API key in the URL
    const url = new URL(`${config.tmdb.baseUrl}${path}`);
    url.searchParams.set('api_key', config.tmdb.apiKey);
    url.searchParams.set('language', config.tmdb.defaultLanguage);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
    return url.toString();
  }

  // Proxy mode (production) — key is added server-side
  const url = new URL(config.tmdb.proxyPath, window.location.origin);
  url.searchParams.set('path', path);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}

/**
 * Generic TMDB fetch wrapper with error handling.
 * @param {string} path
 * @param {Record<string, string|number>} [params={}]
 * @returns {Promise<any>}
 */
async function tmdbFetch(path, params = {}) {
  const url = buildUrl(path, params);
  const response = await fetch(url);

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message =
      errorBody?.status_message || errorBody?.error || `TMDB request failed (${response.status})`;
    throw new Error(message);
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// Image URL helpers
// ---------------------------------------------------------------------------

/**
 * Build a full poster image URL.
 * @param {string|null} path - poster_path from TMDB
 * @param {string} [size='w500']
 * @returns {string|null}
 */
export function getPosterUrl(path, size = 'w500') {
  if (!path) return null;
  return `${config.tmdb.imageBaseUrl}${size}${path}`;
}

/**
 * Build a full backdrop image URL.
 * @param {string|null} path - backdrop_path from TMDB
 * @param {string} [size='w1280']
 * @returns {string|null}
 */
export function getBackdropUrl(path, size = 'w1280') {
  if (!path) return null;
  return `${config.tmdb.imageBaseUrl}${size}${path}`;
}

/**
 * Build a full profile / headshot image URL.
 * @param {string|null} path - profile_path from TMDB
 * @param {string} [size='w185']
 * @returns {string|null}
 */
export function getProfileUrl(path, size = 'w185') {
  if (!path) return null;
  return `${config.tmdb.imageBaseUrl}${size}${path}`;
}

// ---------------------------------------------------------------------------
// Trending
// ---------------------------------------------------------------------------

/**
 * Get trending movies, TV shows, or all.
 * @param {'movie'|'tv'|'all'} [mediaType='all']
 * @param {'day'|'week'} [timeWindow='day']
 * @returns {Promise<{page: number, results: any[], total_pages: number, total_results: number}>}
 */
export async function getTrending(mediaType = 'all', timeWindow = 'day') {
  try {
    return await tmdbFetch(`/trending/${mediaType}/${timeWindow}`);
  } catch (error) {
    console.warn('[TMDB] getTrending failed:', error.message);
    return { page: 1, results: [], total_pages: 0, total_results: 0 };
  }
}

// ---------------------------------------------------------------------------
// Popular / Top Rated
// ---------------------------------------------------------------------------

/**
 * Get popular movies or TV shows.
 * @param {'movie'|'tv'} [mediaType='movie']
 * @param {number} [page=1]
 * @returns {Promise<{page: number, results: any[], total_pages: number, total_results: number}>}
 */
export async function getPopular(mediaType = 'movie', page = 1) {
  try {
    return await tmdbFetch(`/${mediaType}/popular`, { page });
  } catch (error) {
    console.warn('[TMDB] getPopular failed:', error.message);
    return { page, results: [], total_pages: 0, total_results: 0 };
  }
}

/**
 * Get top-rated movies or TV shows.
 * @param {'movie'|'tv'} [mediaType='movie']
 * @param {number} [page=1]
 * @returns {Promise<{page: number, results: any[], total_pages: number, total_results: number}>}
 */
export async function getTopRated(mediaType = 'movie', page = 1) {
  try {
    return await tmdbFetch(`/${mediaType}/top_rated`, { page });
  } catch (error) {
    console.warn('[TMDB] getTopRated failed:', error.message);
    return { page, results: [], total_pages: 0, total_results: 0 };
  }
}

// ---------------------------------------------------------------------------
// Movies — specialty lists
// ---------------------------------------------------------------------------

/**
 * Get movies currently playing in theaters.
 * @param {number} [page=1]
 * @returns {Promise<{page: number, results: any[], total_pages: number, total_results: number}>}
 */
export async function getNowPlaying(page = 1) {
  try {
    return await tmdbFetch('/movie/now_playing', {
      page,
      region: config.tmdb.defaultRegion,
    });
  } catch (error) {
    console.warn('[TMDB] getNowPlaying failed:', error.message);
    return { page, results: [], total_pages: 0, total_results: 0 };
  }
}

/**
 * Get upcoming movies.
 * @param {number} [page=1]
 * @returns {Promise<{page: number, results: any[], total_pages: number, total_results: number}>}
 */
export async function getUpcoming(page = 1) {
  try {
    return await tmdbFetch('/movie/upcoming', {
      page,
      region: config.tmdb.defaultRegion,
    });
  } catch (error) {
    console.warn('[TMDB] getUpcoming failed:', error.message);
    return { page, results: [], total_pages: 0, total_results: 0 };
  }
}

// ---------------------------------------------------------------------------
// TV — specialty lists
// ---------------------------------------------------------------------------

/**
 * Get TV shows airing today.
 * @param {number} [page=1]
 * @returns {Promise<{page: number, results: any[], total_pages: number, total_results: number}>}
 */
export async function getAiringToday(page = 1) {
  try {
    return await tmdbFetch('/tv/airing_today', { page });
  } catch (error) {
    console.warn('[TMDB] getAiringToday failed:', error.message);
    return { page, results: [], total_pages: 0, total_results: 0 };
  }
}

/**
 * Get TV shows currently on the air (airing within the next 7 days).
 * @param {number} [page=1]
 * @returns {Promise<{page: number, results: any[], total_pages: number, total_results: number}>}
 */
export async function getOnTheAir(page = 1) {
  try {
    return await tmdbFetch('/tv/on_the_air', { page });
  } catch (error) {
    console.warn('[TMDB] getOnTheAir failed:', error.message);
    return { page, results: [], total_pages: 0, total_results: 0 };
  }
}

// ---------------------------------------------------------------------------
// Details
// ---------------------------------------------------------------------------

/**
 * Get full details for a movie or TV show, including videos, credits,
 * recommendations, watch providers, reviews, and similar titles.
 * @param {'movie'|'tv'} mediaType
 * @param {number|string} id - TMDB ID
 * @returns {Promise<object|null>}
 */
export async function getDetails(mediaType, id) {
  try {
    return await tmdbFetch(`/${mediaType}/${id}`, {
      append_to_response:
        'videos,credits,recommendations,watch/providers,reviews,similar',
    });
  } catch (error) {
    console.warn('[TMDB] getDetails failed:', error.message);
    return null;
  }
}

/**
 * Get watch / streaming provider info for a title.
 * @param {'movie'|'tv'} mediaType
 * @param {number|string} id
 * @returns {Promise<object|null>} provider data for the configured region
 */
export async function getWatchProviders(mediaType, id) {
  try {
    const data = await tmdbFetch(`/${mediaType}/${id}/watch/providers`);
    return data?.results?.[config.tmdb.defaultRegion] ?? null;
  } catch (error) {
    console.warn('[TMDB] getWatchProviders failed:', error.message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

/**
 * Multi-search across movies, TV shows, and people.
 * @param {string} query
 * @param {number} [page=1]
 * @returns {Promise<{page: number, results: any[], total_pages: number, total_results: number}>}
 */
export async function search(query, page = 1) {
  if (!query || !query.trim()) {
    return { page: 1, results: [], total_pages: 0, total_results: 0 };
  }
  try {
    return await tmdbFetch('/search/multi', { query: query.trim(), page });
  } catch (error) {
    console.warn('[TMDB] search failed:', error.message);
    return { page, results: [], total_pages: 0, total_results: 0 };
  }
}

// ---------------------------------------------------------------------------
// Discover / Genres
// ---------------------------------------------------------------------------

/**
 * Discover movies or TV shows by genre.
 * @param {'movie'|'tv'} mediaType
 * @param {number|string} genreId
 * @param {number} [page=1]
 * @returns {Promise<{page: number, results: any[], total_pages: number, total_results: number}>}
 */
export async function getByGenre(mediaType, genreId, page = 1) {
  try {
    return await tmdbFetch(`/discover/${mediaType}`, {
      with_genres: genreId,
      sort_by: 'popularity.desc',
      page,
    });
  } catch (error) {
    console.warn('[TMDB] getByGenre failed:', error.message);
    return { page, results: [], total_pages: 0, total_results: 0 };
  }
}

/**
 * Get the list of official genres for movies or TV.
 * @param {'movie'|'tv'} [mediaType='movie']
 * @returns {Promise<Array<{id: number, name: string}>>}
 */
export async function getGenres(mediaType = 'movie') {
  try {
    const data = await tmdbFetch(`/genre/${mediaType}/list`);
    return data?.genres ?? [];
  } catch (error) {
    console.warn('[TMDB] getGenres failed:', error.message);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Specialty: Flopping & New On Streaming
// ---------------------------------------------------------------------------

/**
 * Get "flopping" movies — recently released titles with significant votes
 * but very low average scores.
 * @param {number} [page=1]
 * @returns {Promise<{page: number, results: any[], total_pages: number, total_results: number}>}
 */
export async function getFlopping(page = 1) {
  try {
    const now = new Date();
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const dateTo = now.toISOString().slice(0, 10);
    const dateFrom = sixtyDaysAgo.toISOString().slice(0, 10);

    return await tmdbFetch('/discover/movie', {
      sort_by: 'vote_average.asc',
      'vote_count.gte': 50,
      'primary_release_date.gte': dateFrom,
      'primary_release_date.lte': dateTo,
      page,
    });
  } catch (error) {
    console.warn('[TMDB] getFlopping failed:', error.message);
    return { page, results: [], total_pages: 0, total_results: 0 };
  }
}

/**
 * Get movies newly available on streaming (flatrate monetisation).
 * @param {number} [page=1]
 * @returns {Promise<{page: number, results: any[], total_pages: number, total_results: number}>}
 */
export async function getNewOnStreaming(page = 1) {
  try {
    return await tmdbFetch('/discover/movie', {
      sort_by: 'primary_release_date.desc',
      with_watch_monetization_types: 'flatrate',
      watch_region: config.tmdb.defaultRegion,
      page,
    });
  } catch (error) {
    console.warn('[TMDB] getNewOnStreaming failed:', error.message);
    return { page, results: [], total_pages: 0, total_results: 0 };
  }
}

// ---------------------------------------------------------------------------
// Convenience wrappers used by page components
// ---------------------------------------------------------------------------

/**
 * Get movies by category (now_playing, popular, top_rated, upcoming).
 * @param {string} category
 * @param {object} [options={}]
 * @returns {Promise<{page: number, results: any[], total_pages: number, total_results: number}>}
 */
export async function getMovies(category = 'popular', { page = 1, genreId, sortBy } = {}) {
  try {
    if (genreId) {
      return await tmdbFetch('/discover/movie', { page, with_genres: genreId, sort_by: sortBy || 'popularity.desc' });
    }
    const endpoints = {
      now_playing: '/movie/now_playing',
      popular: '/movie/popular',
      top_rated: '/movie/top_rated',
      upcoming: '/movie/upcoming',
    };
    const path = endpoints[category] || '/movie/popular';
    return await tmdbFetch(path, { page });
  } catch (error) {
    console.warn('[TMDB] getMovies failed:', error.message);
    return { page, results: [], total_pages: 0, total_results: 0 };
  }
}

/**
 * Get TV shows by category (airing_today, on_the_air, popular, top_rated).
 * @param {string} category
 * @param {object} [options={}]
 * @returns {Promise<{page: number, results: any[], total_pages: number, total_results: number}>}
 */
export async function getTvShows(category = 'popular', { page = 1, genreId, sortBy } = {}) {
  try {
    if (genreId) {
      return await tmdbFetch('/discover/tv', { page, with_genres: genreId, sort_by: sortBy || 'popularity.desc' });
    }
    const endpoints = {
      airing_today: '/tv/airing_today',
      on_the_air: '/tv/on_the_air',
      popular: '/tv/popular',
      top_rated: '/tv/top_rated',
    };
    const path = endpoints[category] || '/tv/popular';
    return await tmdbFetch(path, { page });
  } catch (error) {
    console.warn('[TMDB] getTvShows failed:', error.message);
    return { page, results: [], total_pages: 0, total_results: 0 };
  }
}

/** Alias for search() used by Search page. */
export const searchMulti = search;

/**
 * Get credits (cast & crew) for a movie or TV show.
 * @param {'movie'|'tv'} mediaType
 * @param {number|string} id
 * @returns {Promise<{cast: any[], crew: any[]}>}
 */
export async function getCredits(mediaType, id) {
  try {
    return await tmdbFetch(`/${mediaType}/${id}/credits`);
  } catch (error) {
    console.warn('[TMDB] getCredits failed:', error.message);
    return { cast: [], crew: [] };
  }
}

/**
 * Get videos (trailers, teasers, etc.) for a movie or TV show.
 * @param {'movie'|'tv'} mediaType
 * @param {number|string} id
 * @returns {Promise<{results: any[]}>}
 */
export async function getVideos(mediaType, id) {
  try {
    return await tmdbFetch(`/${mediaType}/${id}/videos`);
  } catch (error) {
    console.warn('[TMDB] getVideos failed:', error.message);
    return { results: [] };
  }
}

/**
 * Get reviews for a movie or TV show.
 * @param {'movie'|'tv'} mediaType
 * @param {number|string} id
 * @returns {Promise<{results: any[]}>}
 */
export async function getReviews(mediaType, id) {
  try {
    return await tmdbFetch(`/${mediaType}/${id}/reviews`);
  } catch (error) {
    console.warn('[TMDB] getReviews failed:', error.message);
    return { results: [] };
  }
}

/**
 * Get recommendations for a movie or TV show.
 * @param {'movie'|'tv'} mediaType
 * @param {number|string} id
 * @returns {Promise<{results: any[]}>}
 */
export async function getRecommendations(mediaType, id) {
  try {
    return await tmdbFetch(`/${mediaType}/${id}/recommendations`);
  } catch (error) {
    console.warn('[TMDB] getRecommendations failed:', error.message);
    return { results: [] };
  }
}

/**
 * Get similar titles for a movie or TV show.
 * @param {'movie'|'tv'} mediaType
 * @param {number|string} id
 * @returns {Promise<{results: any[]}>}
 */
export async function getSimilar(mediaType, id) {
  try {
    return await tmdbFetch(`/${mediaType}/${id}/similar`);
  } catch (error) {
    console.warn('[TMDB] getSimilar failed:', error.message);
    return { results: [] };
  }
}

/**
 * Get season details for a TV show.
 * @param {number|string} tvId
 * @param {number} seasonNumber
 * @returns {Promise<object|null>}
 */
export async function getSeasonDetails(tvId, seasonNumber) {
  try {
    return await tmdbFetch(`/tv/${tvId}/season/${seasonNumber}`);
  } catch (error) {
    console.warn('[TMDB] getSeasonDetails failed:', error.message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Default export — all methods as a single service object
// ---------------------------------------------------------------------------

const tmdbService = {
  getTrending,
  getPopular,
  getTopRated,
  getNowPlaying,
  getUpcoming,
  getAiringToday,
  getOnTheAir,
  getDetails,
  getWatchProviders,
  search,
  searchMulti,
  getByGenre,
  getGenres,
  getFlopping,
  getNewOnStreaming,
  getMovies,
  getTvShows,
  getCredits,
  getVideos,
  getReviews,
  getRecommendations,
  getSimilar,
  getSeasonDetails,
  getPosterUrl,
  getBackdropUrl,
  getProfileUrl,
};

export default tmdbService;
