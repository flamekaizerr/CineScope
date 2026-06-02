/**
 * @file React context for all user data — watchlist, watching, completed,
 * dropped, ratings, and preferences. Auto-syncs to Google Drive (debounced)
 * when data changes, and loads from Drive when the user authenticates.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from 'react';
import { useAuth } from './AuthContext.jsx';
import googleDriveService from '../services/google-drive.js';
import { debounce, generateId } from '../utils/helpers.js';
import { LIST_TYPES, SYNC_DEBOUNCE_MS } from '../utils/constants.js';

/** @type {React.Context} */
const UserDataContext = createContext(null);

// ---------------------------------------------------------------------------
// Initial state factory
// ---------------------------------------------------------------------------

function createInitialState() {
  return {
    watchlist: [],
    watching: [],
    completed: [],
    dropped: [],
    ratings: {},
    preferences: {
      favoriteGenres: [],
      dislikedGenres: [],
      preferredThemes: [],
    },
  };
}

// ---------------------------------------------------------------------------
// Provider component
// ---------------------------------------------------------------------------

/**
 * UserDataProvider — manages all user-facing data and synchronises it
 * with Google Drive whenever the authenticated user changes data.
 *
 * @param {{ children: React.ReactNode }} props
 */
export function UserDataProvider({ children }) {
  const { accessToken, isAuthenticated } = useAuth();
  const [data, setData] = useState(createInitialState);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const syncRef = useRef(null);

  // -----------------------------------------------------------------------
  // Google Drive sync (debounced)
  // -----------------------------------------------------------------------
  useEffect(() => {
    syncRef.current = debounce(async (snapshot) => {
      if (!accessToken) return;
      setIsSyncing(true);
      try {
        googleDriveService.init(accessToken);
        await googleDriveService.syncAll(snapshot);
        setLastSyncedAt(new Date().toISOString());
      } catch (error) {
        console.error('[UserData] Drive sync failed:', error.message);
      } finally {
        setIsSyncing(false);
      }
    }, SYNC_DEBOUNCE_MS);

    return () => {
      syncRef.current?.cancel();
    };
  }, [accessToken]);

  /** Trigger a debounced sync whenever data changes (but only if signed in) */
  useEffect(() => {
    if (isAuthenticated && syncRef.current) {
      syncRef.current(data);
    }
  }, [data, isAuthenticated]);

  // -----------------------------------------------------------------------
  // Load from Drive on authentication
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    let cancelled = false;

    async function loadFromDrive() {
      try {
        googleDriveService.init(accessToken);
        const remote = await googleDriveService.loadAll();
        if (cancelled) return;

        if (remote && Object.keys(remote).length > 0) {
          setData((prev) => ({
            watchlist: remote.watchlist ?? prev.watchlist,
            watching: remote.watching ?? prev.watching,
            completed: remote.completed ?? prev.completed,
            dropped: remote.dropped ?? prev.dropped,
            ratings: remote.ratings ?? prev.ratings,
            preferences: remote.preferences ?? prev.preferences,
          }));
          setLastSyncedAt(new Date().toISOString());
        }
      } catch (error) {
        console.error('[UserData] Load from Drive failed:', error.message);
      }
    }

    loadFromDrive();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, accessToken]);

  // -----------------------------------------------------------------------
  // List item helpers
  // -----------------------------------------------------------------------

  /**
   * Build a normalised list item from arbitrary input.
   * @param {object} rawItem
   * @returns {object}
   */
  const normaliseItem = useCallback((rawItem) => ({
    id: rawItem.id,
    type: rawItem.type || rawItem.mediaType || 'movie',
    title: rawItem.title || rawItem.name || 'Untitled',
    poster: rawItem.poster || rawItem.poster_path || null,
    addedAt: rawItem.addedAt || new Date().toISOString(),
    _uid: rawItem._uid || generateId(),
  }), []);

  // -----------------------------------------------------------------------
  // CRUD actions
  // -----------------------------------------------------------------------

  /** Remove an item from ALL lists (internal helper). */
  const removeFromAllLists = useCallback((itemId, itemType) => {
    setData((prev) => {
      const next = { ...prev };
      for (const key of [LIST_TYPES.WATCHLIST, LIST_TYPES.WATCHING, LIST_TYPES.COMPLETED, LIST_TYPES.DROPPED]) {
        next[key] = prev[key].filter(
          (i) => !(i.id === itemId && i.type === itemType),
        );
      }
      return next;
    });
  }, []);

  /**
   * Add an item to the watchlist.
   * @param {object} item
   */
  const addToWatchlist = useCallback(
    (item) => {
      const normalised = normaliseItem(item);
      setData((prev) => {
        // Remove from other lists first
        const cleaned = { ...prev };
        for (const key of [LIST_TYPES.WATCHING, LIST_TYPES.COMPLETED, LIST_TYPES.DROPPED]) {
          cleaned[key] = prev[key].filter(
            (i) => !(i.id === normalised.id && i.type === normalised.type),
          );
        }
        // Avoid duplicates in watchlist
        if (prev.watchlist.some((i) => i.id === normalised.id && i.type === normalised.type)) {
          return cleaned;
        }
        cleaned.watchlist = [...prev.watchlist, normalised];
        return cleaned;
      });
    },
    [normaliseItem],
  );

  /**
   * Remove an item from the watchlist.
   * @param {string|number} itemId
   * @param {string} itemType
   */
  const removeFromWatchlist = useCallback((itemId, itemType) => {
    setData((prev) => ({
      ...prev,
      watchlist: prev.watchlist.filter(
        (i) => !(i.id === itemId && i.type === itemType),
      ),
    }));
  }, []);

  /**
   * Move an item to "currently watching" (with optional progress).
   * @param {object} item
   * @param {{ episode?: number, season?: number, progress?: number }} [progress={}]
   */
  const moveToWatching = useCallback(
    (item, progress = {}) => {
      const normalised = {
        ...normaliseItem(item),
        progress: {
          episode: progress.episode ?? 0,
          season: progress.season ?? 1,
          percentage: progress.progress ?? 0,
        },
        startedAt: new Date().toISOString(),
      };
      setData((prev) => {
        const cleaned = { ...prev };
        for (const key of [LIST_TYPES.WATCHLIST, LIST_TYPES.COMPLETED, LIST_TYPES.DROPPED]) {
          cleaned[key] = prev[key].filter(
            (i) => !(i.id === normalised.id && i.type === normalised.type),
          );
        }
        // Replace or add in watching
        cleaned.watching = [
          ...prev.watching.filter(
            (i) => !(i.id === normalised.id && i.type === normalised.type),
          ),
          normalised,
        ];
        return cleaned;
      });
    },
    [normaliseItem],
  );

  /**
   * Mark an item as completed with an optional user rating.
   * @param {object} item
   * @param {number} [rating]
   */
  const markCompleted = useCallback(
    (item, rating) => {
      const normalised = {
        ...normaliseItem(item),
        completedAt: new Date().toISOString(),
        userRating: rating ?? null,
      };
      setData((prev) => {
        const cleaned = { ...prev };
        for (const key of [LIST_TYPES.WATCHLIST, LIST_TYPES.WATCHING, LIST_TYPES.DROPPED]) {
          cleaned[key] = prev[key].filter(
            (i) => !(i.id === normalised.id && i.type === normalised.type),
          );
        }
        cleaned.completed = [
          ...prev.completed.filter(
            (i) => !(i.id === normalised.id && i.type === normalised.type),
          ),
          normalised,
        ];
        // Also store the rating in the ratings map
        if (rating != null) {
          const ratingKey = `${normalised.type}:${normalised.id}`;
          cleaned.ratings = { ...prev.ratings, [ratingKey]: rating };
        }
        return cleaned;
      });
    },
    [normaliseItem],
  );

  /**
   * Mark an item as dropped.
   * @param {object} item
   */
  const markDropped = useCallback(
    (item) => {
      const normalised = {
        ...normaliseItem(item),
        droppedAt: new Date().toISOString(),
      };
      setData((prev) => {
        const cleaned = { ...prev };
        for (const key of [LIST_TYPES.WATCHLIST, LIST_TYPES.WATCHING, LIST_TYPES.COMPLETED]) {
          cleaned[key] = prev[key].filter(
            (i) => !(i.id === normalised.id && i.type === normalised.type),
          );
        }
        cleaned.dropped = [
          ...prev.dropped.filter(
            (i) => !(i.id === normalised.id && i.type === normalised.type),
          ),
          normalised,
        ];
        return cleaned;
      });
    },
    [normaliseItem],
  );

  /**
   * Rate an item (without necessarily moving it between lists).
   * @param {string|number} itemId
   * @param {string} itemType
   * @param {number} rating — 1–10
   */
  const rateItem = useCallback((itemId, itemType, rating) => {
    const ratingKey = `${itemType}:${itemId}`;
    setData((prev) => ({
      ...prev,
      ratings: { ...prev.ratings, [ratingKey]: rating },
    }));
  }, []);

  /**
   * Update user preferences.
   * @param {Partial<{favoriteGenres: string[], dislikedGenres: string[], preferredThemes: string[]}>} updates
   */
  const updatePreferences = useCallback((updates) => {
    setData((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, ...updates },
    }));
  }, []);

  /**
   * Get the list an item currently belongs to, or null.
   * @param {string|number} itemId
   * @param {string} itemType
   * @returns {string|null}
   */
  const getItemStatus = useCallback(
    (itemId, itemType) => {
      for (const key of [LIST_TYPES.WATCHLIST, LIST_TYPES.WATCHING, LIST_TYPES.COMPLETED, LIST_TYPES.DROPPED]) {
        if (data[key].some((i) => i.id === itemId && i.type === itemType)) {
          return key;
        }
      }
      return null;
    },
    [data],
  );

  // -----------------------------------------------------------------------
  // Context value
  // -----------------------------------------------------------------------
  const value = useMemo(
    () => ({
      // State
      watchlist: data.watchlist,
      watching: data.watching,
      completed: data.completed,
      dropped: data.dropped,
      ratings: data.ratings,
      preferences: data.preferences,
      isSyncing,
      lastSyncedAt,

      // Actions
      addToWatchlist,
      removeFromWatchlist,
      moveToWatching,
      markCompleted,
      markDropped,
      rateItem,
      updatePreferences,
      getItemStatus,
      removeFromAllLists,

      // Convenience counters
      watchlistCount: data.watchlist.length,
      watchingCount: data.watching.length,
      completedCount: data.completed.length,
      droppedCount: data.dropped.length,
    }),
    [
      data,
      isSyncing,
      lastSyncedAt,
      addToWatchlist,
      removeFromWatchlist,
      moveToWatching,
      markCompleted,
      markDropped,
      rateItem,
      updatePreferences,
      getItemStatus,
      removeFromAllLists,
    ],
  );

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  );
}

/**
 * Hook to access user data and actions.
 * Must be used inside a `<UserDataProvider>`.
 * @returns {object}
 */
export function useUserData() {
  const context = useContext(UserDataContext);
  if (!context) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
}

export default UserDataContext;
