/**
 * @file Google Drive appDataFolder service for CineScope.
 * Persists user data (watchlists, ratings, preferences) as JSON files in the
 * hidden app-specific folder so only this app can see them.
 */

import config from '../config/api.js';

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

let _accessToken = null;

/**
 * Convenience headers builder.
 * @returns {Record<string, string>}
 */
function authHeaders() {
  return {
    Authorization: `Bearer ${_accessToken}`,
    'Content-Type': 'application/json',
  };
}

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------

/**
 * Initialise the Google Drive service with a valid access token.
 * @param {string} accessToken - OAuth 2.0 access token with Drive appdata scope
 */
export function init(accessToken) {
  _accessToken = accessToken;
}

// ---------------------------------------------------------------------------
// Core helpers
// ---------------------------------------------------------------------------

/**
 * Find a file by name in the appDataFolder.
 * @param {string} fileName
 * @returns {Promise<{id: string, name: string}|null>}
 */
async function findFile(fileName) {
  const query = encodeURIComponent(
    `name='${fileName}' and 'appDataFolder' in parents and trashed=false`,
  );
  const url = `${config.google.driveApiUrl}/files?spaces=appDataFolder&q=${query}&fields=files(id,name)`;

  const response = await fetch(url, { headers: authHeaders() });
  if (!response.ok) {
    throw new Error(`Drive findFile failed (${response.status})`);
  }

  const data = await response.json();
  return data.files?.[0] ?? null;
}

/**
 * Read the JSON content of a file by its ID.
 * @param {string} fileId
 * @returns {Promise<any>}
 */
async function readFileContent(fileId) {
  const url = `${config.google.driveApiUrl}/files/${fileId}?alt=media`;
  const response = await fetch(url, { headers: authHeaders() });
  if (!response.ok) {
    throw new Error(`Drive readFileContent failed (${response.status})`);
  }
  return response.json();
}

/**
 * Create a new JSON file in appDataFolder.
 * @param {string} fileName
 * @param {any} data
 * @returns {Promise<string>} the new file ID
 */
async function createFile(fileName, data) {
  const metadata = {
    name: fileName,
    parents: ['appDataFolder'],
    mimeType: 'application/json',
  };

  // Multipart upload
  const boundary = '-------cinescope_boundary';
  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(metadata),
    `--${boundary}`,
    'Content-Type: application/json',
    '',
    JSON.stringify(data),
    `--${boundary}--`,
  ].join('\r\n');

  const url = `${config.google.driveUploadUrl}/files?uploadType=multipart&fields=id`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${_accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`Drive createFile failed (${response.status}): ${errorBody}`);
  }

  const result = await response.json();
  return result.id;
}

/**
 * Update an existing file's content.
 * @param {string} fileId
 * @param {any} data
 * @returns {Promise<void>}
 */
async function updateFile(fileId, data) {
  const url = `${config.google.driveUploadUrl}/files/${fileId}?uploadType=media`;
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${_accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`Drive updateFile failed (${response.status}): ${errorBody}`);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Save JSON data to a file named `{key}.json` in appDataFolder.
 * Creates the file if it doesn't exist, otherwise updates it.
 * @param {string} key - logical data key (e.g. 'watchlist', 'ratings')
 * @param {any} data - serialisable data
 * @returns {Promise<string>} file ID
 */
export async function saveData(key, data) {
  try {
    const fileName = `${key}.json`;
    const existing = await findFile(fileName);

    if (existing) {
      await updateFile(existing.id, data);
      return existing.id;
    }

    return await createFile(fileName, data);
  } catch (error) {
    console.error(`[GoogleDrive] saveData("${key}") failed:`, error.message);
    throw error;
  }
}

/**
 * Load JSON data from a file named `{key}.json` in appDataFolder.
 * @param {string} key
 * @returns {Promise<any|null>} parsed data or null if file not found
 */
export async function loadData(key) {
  try {
    const fileName = `${key}.json`;
    const file = await findFile(fileName);
    if (!file) return null;
    return await readFileContent(file.id);
  } catch (error) {
    console.error(`[GoogleDrive] loadData("${key}") failed:`, error.message);
    return null;
  }
}

/**
 * Sync all user data to Google Drive in one batch.
 * @param {object} userData
 * @param {any[]} [userData.watchlist]
 * @param {any[]} [userData.watching]
 * @param {any[]} [userData.completed]
 * @param {any[]} [userData.dropped]
 * @param {Record<string, number>} [userData.ratings]
 * @param {object} [userData.preferences]
 * @returns {Promise<void>}
 */
export async function syncAll(userData) {
  if (!_accessToken) {
    console.warn('[GoogleDrive] syncAll skipped — no access token');
    return;
  }

  const entries = Object.entries(userData);
  const results = await Promise.allSettled(
    entries.map(([key, value]) => saveData(key, value)),
  );

  results.forEach((result, idx) => {
    if (result.status === 'rejected') {
      console.error(
        `[GoogleDrive] syncAll: failed to save "${entries[idx][0]}":`,
        result.reason?.message,
      );
    }
  });
}

/**
 * Load all user data from Google Drive.
 * @returns {Promise<{watchlist?: any[], watching?: any[], completed?: any[], dropped?: any[], ratings?: Record<string, number>, preferences?: object}>}
 */
export async function loadAll() {
  if (!_accessToken) {
    console.warn('[GoogleDrive] loadAll skipped — no access token');
    return {};
  }

  const keys = ['watchlist', 'watching', 'completed', 'dropped', 'ratings', 'preferences'];
  const results = await Promise.allSettled(keys.map((key) => loadData(key)));

  const output = {};
  results.forEach((result, idx) => {
    if (result.status === 'fulfilled' && result.value !== null) {
      output[keys[idx]] = result.value;
    }
  });

  return output;
}

/**
 * List all files stored in the app's appDataFolder.
 * @returns {Promise<Array<{id: string, name: string, modifiedTime: string}>>}
 */
export async function listFiles() {
  try {
    const url = `${config.google.driveApiUrl}/files?spaces=appDataFolder&fields=files(id,name,modifiedTime)&pageSize=100`;
    const response = await fetch(url, { headers: authHeaders() });
    if (!response.ok) {
      throw new Error(`Drive listFiles failed (${response.status})`);
    }
    const data = await response.json();
    return data.files ?? [];
  } catch (error) {
    console.error('[GoogleDrive] listFiles failed:', error.message);
    return [];
  }
}

/**
 * Delete a file by ID.
 * @param {string} fileId
 * @returns {Promise<boolean>} true if deleted successfully
 */
export async function deleteFile(fileId) {
  try {
    const url = `${config.google.driveApiUrl}/files/${fileId}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${_accessToken}` },
    });
    return response.ok || response.status === 204;
  } catch (error) {
    console.error('[GoogleDrive] deleteFile failed:', error.message);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Default export
// ---------------------------------------------------------------------------

const googleDriveService = {
  init,
  saveData,
  loadData,
  syncAll,
  loadAll,
  listFiles,
  deleteFile,
};

export default googleDriveService;
