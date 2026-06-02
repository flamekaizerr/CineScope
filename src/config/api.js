/**
 * @file Central API configuration for CineScope.
 *
 * In production (Vercel), API calls go through serverless proxies at /api/*
 * so that API keys never leave the server. The browser sees ZERO secrets.
 *
 * In local development, the Vite dev server proxy forwards /api/* requests
 * to the same serverless functions via `vercel dev`, or you can set
 * VITE_USE_DIRECT_API=true in .env to skip the proxy for quick testing.
 *
 * The ONLY client-side credential is the Google OAuth Client ID,
 * which is designed by Google to be public (security is enforced via
 * authorized redirect URIs, not client ID secrecy).
 */

const config = {
  /**
   * Keep third-party credentials behind /api/* in both production and local dev.
   * Vite supplies matching local middleware; Vercel supplies serverless functions.
   */
  useDirectApi: false,

  /** TMDB (The Movie Database) */
  tmdb: {
    proxyPath: '/api/tmdb',
    baseUrl: 'https://api.themoviedb.org/3',
    imageBaseUrl: 'https://image.tmdb.org/t/p/',
    posterSizes: ['w92', 'w154', 'w185', 'w342', 'w500', 'w780', 'original'],
    backdropSizes: ['w300', 'w780', 'w1280', 'original'],
    profileSizes: ['w45', 'w185', 'h632', 'original'],
    defaultRegion: 'US',
    defaultLanguage: 'en-US',
  },

  /** Jikan (MyAnimeList unofficial API) — no key, no proxy needed */
  jikan: {
    baseUrl: 'https://api.jikan.moe/v4',
    rateLimit: 3,
    rateLimitMs: 334,
  },

  /** Trakt */
  trakt: {
    proxyPath: '/api/trakt',
    baseUrl: 'https://api.trakt.tv',
    apiVersion: '2',
  },

  /** Google Gemini AI */
  gemini: {
    proxyPath: '/api/gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    model: 'gemini-2.0-flash',
  },

  /** Google OAuth / Identity Services — Client ID is PUBLIC by design */
  google: {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
    driveApiUrl: 'https://www.googleapis.com/drive/v3',
    driveUploadUrl: 'https://www.googleapis.com/upload/drive/v3',
    scopes: [
      'https://www.googleapis.com/auth/drive.appdata',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
  },
};

/**
 * Check whether a specific API service has been configured.
 * In proxy mode, the server holds the keys — we just need the proxy to exist.
 * In direct mode, we check for VITE_ env vars.
 * @param {'tmdb'|'trakt'|'gemini'|'google'|'jikan'} service
 * @returns {boolean}
 */
export function isApiConfigured(service) {
  // In proxy mode, assume configured (server/dev middleware has the keys)
  if (!config.useDirectApi && service !== 'google') {
    return true;
  }

  switch (service) {
    case 'tmdb':
      return true;
    case 'trakt':
      return true;
    case 'gemini':
      return true;
    case 'google':
      return config.google.clientId.length > 0;
    case 'jikan':
      return true;
    default:
      return false;
  }
}

/**
 * Check whether ALL external API services are configured.
 * @returns {boolean}
 */
export function areAllApisConfigured() {
  return ['tmdb', 'trakt', 'gemini', 'google'].every(isApiConfigured);
}

export default config;
