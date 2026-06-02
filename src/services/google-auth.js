/**
 * @file Google Identity Services (GIS) authentication service for CineScope.
 * Provides a singleton class that manages OAuth 2.0 sign-in, token lifecycle,
 * and user profile retrieval using the GSI client library.
 */

import config from '../config/api.js';

/**
 * @class GoogleAuth
 * Singleton wrapper around Google Identity Services.
 */
class GoogleAuth {
  constructor() {
    /** @type {google.accounts.oauth2.TokenClient|null} */
    this._tokenClient = null;
    /** @type {object|null} */
    this._accessToken = null;
    /** @type {number|null} */
    this._tokenExpiresAt = null;
    /** @type {object|null} */
    this._userProfile = null;
    /** @type {boolean} */
    this._initialized = false;
    /** @type {Function|null} */
    this._onAuthChange = null;
    /** @type {Function|null} Resolve fn for the pending sign-in promise */
    this._pendingResolve = null;
    /** @type {Function|null} Reject fn for the pending sign-in promise */
    this._pendingReject = null;
  }

  // -----------------------------------------------------------------------
  // Initialisation
  // -----------------------------------------------------------------------

  /**
   * Initialise Google Identity Services.
   * Loads the GSI script if not already loaded and creates a TokenClient.
   *
   * @param {string} [clientId] — Google OAuth Client ID (defaults to config)
   * @param {Function} [onAuthChange] — callback invoked on auth state change
   * @returns {Promise<void>}
   */
  async initGoogleAuth(clientId, onAuthChange) {
    if (this._initialized) return;

    const cid = clientId || config.google.clientId;
    if (onAuthChange) this._onAuthChange = onAuthChange;

    // Load the GSI script dynamically if not present
    await this._loadGsiScript();

    this._tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: cid,
      scope: config.google.scopes.join(' '),
      callback: (tokenResponse) => this._handleTokenResponse(tokenResponse),
      error_callback: (error) => this._handleTokenError(error),
    });

    this._initialized = true;
  }

  // -----------------------------------------------------------------------
  // Sign in / out
  // -----------------------------------------------------------------------

  /**
   * Trigger the Google sign-in consent flow.
   * @returns {Promise<object>} resolved with the user profile on success
   */
  signIn() {
    if (!this._initialized) {
      return Promise.reject(new Error('GoogleAuth not initialised. Call initGoogleAuth() first.'));
    }

    return new Promise((resolve, reject) => {
      this._pendingResolve = resolve;
      this._pendingReject = reject;
      this._tokenClient.requestAccessToken();
    });
  }

  /**
   * Sign the user out — revokes the access token and clears local state.
   */
  signOut() {
    if (this._accessToken) {
      try {
        window.google.accounts.oauth2.revoke(this._accessToken, () => {});
      } catch {
        // Ignore revoke errors
      }
    }
    this._accessToken = null;
    this._tokenExpiresAt = null;
    this._userProfile = null;
    this._notifyAuthChange();
  }

  // -----------------------------------------------------------------------
  // Token management
  // -----------------------------------------------------------------------

  /**
   * Get the current access token string.
   * @returns {string|null}
   */
  getAccessToken() {
    if (!this._accessToken) return null;
    // If token has expired, return null so callers know to refresh
    if (this._tokenExpiresAt && Date.now() >= this._tokenExpiresAt) {
      return null;
    }
    return this._accessToken;
  }

  /**
   * Refresh the access token by re-triggering the consent-less flow.
   * @returns {Promise<string>} the new access token
   */
  refreshToken() {
    if (!this._initialized) {
      return Promise.reject(new Error('GoogleAuth not initialised.'));
    }
    return new Promise((resolve, reject) => {
      this._pendingResolve = () => resolve(this._accessToken);
      this._pendingReject = reject;
      this._tokenClient.requestAccessToken({ prompt: '' });
    });
  }

  // -----------------------------------------------------------------------
  // State queries
  // -----------------------------------------------------------------------

  /**
   * Check whether a user is currently signed in with a valid token.
   * @returns {boolean}
   */
  isSignedIn() {
    return (
      this._accessToken !== null &&
      this._tokenExpiresAt !== null &&
      Date.now() < this._tokenExpiresAt
    );
  }

  /**
   * Get the authenticated user's profile.
   * @returns {Promise<{name: string, email: string, picture: string}|null>}
   */
  async getUserProfile() {
    if (this._userProfile) return this._userProfile;
    if (!this._accessToken) return null;

    try {
      const response = await fetch(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        { headers: { Authorization: `Bearer ${this._accessToken}` } },
      );
      if (!response.ok) return null;
      const data = await response.json();
      this._userProfile = {
        name: data.name ?? '',
        email: data.email ?? '',
        picture: data.picture ?? '',
      };
      return this._userProfile;
    } catch (error) {
      console.error('[GoogleAuth] getUserProfile failed:', error.message);
      return null;
    }
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  /**
   * Dynamically inject the Google Identity Services script.
   * @returns {Promise<void>}
   */
  _loadGsiScript() {
    return new Promise((resolve, reject) => {
      if (window.google?.accounts?.oauth2) {
        resolve();
        return;
      }

      const existingScript = document.querySelector(
        'script[src="https://accounts.google.com/gsi/client"]',
      );
      if (existingScript) {
        existingScript.addEventListener('load', resolve);
        existingScript.addEventListener('error', () =>
          reject(new Error('Failed to load Google Identity Services script')),
        );
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = () =>
        reject(new Error('Failed to load Google Identity Services script'));
      document.head.appendChild(script);
    });
  }

  /**
   * Handle a successful token response from GIS.
   * @param {object} tokenResponse
   */
  async _handleTokenResponse(tokenResponse) {
    if (tokenResponse.error) {
      this._handleTokenError(tokenResponse);
      return;
    }

    this._accessToken = tokenResponse.access_token;
    const expiresInMs = (tokenResponse.expires_in || 3600) * 1000;
    this._tokenExpiresAt = Date.now() + expiresInMs;
    this._userProfile = null; // reset so it refetches

    // Pre-fetch the profile
    const profile = await this.getUserProfile();

    this._notifyAuthChange();

    if (this._pendingResolve) {
      this._pendingResolve(profile);
      this._pendingResolve = null;
      this._pendingReject = null;
    }
  }

  /**
   * Handle a token error from GIS.
   * @param {object} error
   */
  _handleTokenError(error) {
    console.error('[GoogleAuth] Token error:', error);
    if (this._pendingReject) {
      this._pendingReject(
        new Error(error?.message || error?.type || 'Authentication failed'),
      );
      this._pendingResolve = null;
      this._pendingReject = null;
    }
  }

  /**
   * Notify the registered auth-change callback.
   */
  _notifyAuthChange() {
    if (typeof this._onAuthChange === 'function') {
      this._onAuthChange({
        isSignedIn: this.isSignedIn(),
        accessToken: this._accessToken,
        profile: this._userProfile,
      });
    }
  }
}

/** Singleton instance */
const googleAuth = new GoogleAuth();

export { GoogleAuth };
export default googleAuth;
