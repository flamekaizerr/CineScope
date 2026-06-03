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
const STORAGE_KEY = 'cinescope_user_data_v2';

// ---------------------------------------------------------------------------
// Initial state factory
// ---------------------------------------------------------------------------

function createInitialState() {
  const initial = {
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

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return initial;
    const parsed = JSON.parse(saved);
    
    // Fix corrupted types (e.g. TMDB returning 'Scripted' or 'Miniseries' for TV shows)
    const validTypes = ['movie', 'tv', 'anime'];
    const cleanList = (list) => (list || []).map(item => {
      let t = item.media_type || item.mediaType || item.type;
      if (!validTypes.includes(t)) t = 'movie';
      // If it has 'first_air_date' or 'name' instead of 'title', it's likely a TV show
      if (t === 'movie' && (item.first_air_date || (item.name && !item.title))) t = 'tv';
      return { ...item, type: t, media_type: t };
    });

    return {
      ...initial,
      ...parsed,
      watchlist: cleanList(parsed.watchlist),
      watching: cleanList(parsed.watching),
      completed: cleanList(parsed.completed),
      dropped: cleanList(parsed.dropped),
      preferences: { ...initial.preferences, ...(parsed.preferences || {}) },
    };
  } catch {
    return initial;
  }
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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('[UserData] Local save failed:', error.message);
    }
  }, [data]);

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
    type: rawItem.media_type || rawItem.mediaType || (rawItem.type && ['movie', 'tv', 'anime'].includes(rawItem.type) ? rawItem.type : null) || 'movie',
    media_type: rawItem.media_type || rawItem.mediaType || (rawItem.type && ['movie', 'tv', 'anime'].includes(rawItem.type) ? rawItem.type : null) || 'movie',
    title: rawItem.title || rawItem.name || 'Untitled',
    poster: rawItem.poster || rawItem.poster_path || null,
    poster_path: rawItem.poster_path || rawItem.poster || null,
    backdrop_path: rawItem.backdrop_path || null,
    release_date: rawItem.release_date || rawItem.first_air_date || rawItem.aired?.from || null,
    vote_average: rawItem.vote_average || rawItem.score || null,
    genres: rawItem.genres || [],
    addedAt: rawItem.addedAt || new Date().toISOString(),
    added_at: rawItem.added_at || rawItem.addedAt || new Date().toISOString(),
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
          (i) => !(String(i.id) === String(itemId) && i.type === itemType),
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
            (i) => !(String(i.id) === String(normalised.id) && i.type === normalised.type),
          );
        }
        // Avoid duplicates in watchlist
        if (prev.watchlist.some((i) => String(i.id) === String(normalised.id) && i.type === normalised.type)) {
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
        (i) => !(String(i.id) === String(itemId) && i.type === itemType),
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
            (i) => !(String(i.id) === String(normalised.id) && i.type === normalised.type),
          );
        }
        // Replace or add in watching
        cleaned.watching = [
          ...prev.watching.filter(
            (i) => !(String(i.id) === String(normalised.id) && i.type === normalised.type),
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
            (i) => !(String(i.id) === String(normalised.id) && i.type === normalised.type),
          );
        }
        cleaned.completed = [
          ...prev.completed.filter(
            (i) => !(String(i.id) === String(normalised.id) && i.type === normalised.type),
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
            (i) => !(String(i.id) === String(normalised.id) && i.type === normalised.type),
          );
        }
        cleaned.dropped = [
          ...prev.dropped.filter(
            (i) => !(String(i.id) === String(normalised.id) && i.type === normalised.type),
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

  const addToList = useCallback((listType, item) => {
    if (!Object.values(LIST_TYPES).includes(listType)) return;
    const normalised = { ...normaliseItem(item), list: listType };

    setData((prev) => {
      const next = { ...prev };
      for (const key of [LIST_TYPES.WATCHLIST, LIST_TYPES.WATCHING, LIST_TYPES.COMPLETED, LIST_TYPES.DROPPED]) {
        next[key] = prev[key].filter(
          (i) => !(String(i.id) === String(normalised.id) && i.type === normalised.type),
        );
      }
      next[listType] = [...next[listType], normalised];
      return next;
    });
  }, [normaliseItem]);

  const removeFromList = useCallback((listType, itemId, itemType) => {
    if (!Object.values(LIST_TYPES).includes(listType)) return;
    setData((prev) => ({
      ...prev,
      [listType]: prev[listType].filter(
        (i) => !(String(i.id) === String(itemId) && (i.type === itemType || i.media_type === itemType)),
      ),
    }));
  }, []);

  const removeItem = useCallback((itemId, itemType) => {
    removeFromAllLists(itemId, itemType);
  }, [removeFromAllLists]);

  const moveItem = useCallback((itemId, itemType, listType) => {
    if (!Object.values(LIST_TYPES).includes(listType)) return;
    setData((prev) => {
      let found = null;
      for (const key of [LIST_TYPES.WATCHLIST, LIST_TYPES.WATCHING, LIST_TYPES.COMPLETED, LIST_TYPES.DROPPED]) {
        found = found || prev[key].find(
          (i) => String(i.id) === String(itemId) && (i.type === itemType || i.media_type === itemType),
        );
      }
      if (!found) return prev;

      const next = { ...prev };
      for (const key of [LIST_TYPES.WATCHLIST, LIST_TYPES.WATCHING, LIST_TYPES.COMPLETED, LIST_TYPES.DROPPED]) {
        next[key] = prev[key].filter(
          (i) => !(String(i.id) === String(itemId) && (i.type === itemType || i.media_type === itemType)),
        );
      }
      next[listType] = [...next[listType], { ...found, list: listType }];
      return next;
    });
  }, []);

  const updateRating = useCallback((itemId, itemType, rating) => {
    rateItem(itemId, itemType, rating);
    setData((prev) => {
      const next = { ...prev, ratings: { ...prev.ratings, [`${itemType}:${itemId}`]: rating } };
      for (const key of [LIST_TYPES.WATCHLIST, LIST_TYPES.WATCHING, LIST_TYPES.COMPLETED, LIST_TYPES.DROPPED]) {
        next[key] = prev[key].map((item) => (
          String(item.id) === String(itemId) && (item.type === itemType || item.media_type === itemType)
            ? { ...item, rating, userRating: rating }
            : item
        ));
      }
      return next;
    });
  }, [rateItem]);

  const getItem = useCallback((itemId, itemType) => {
    for (const key of [LIST_TYPES.WATCHLIST, LIST_TYPES.WATCHING, LIST_TYPES.COMPLETED, LIST_TYPES.DROPPED]) {
      const item = data[key].find(
        (i) => String(i.id) === String(itemId) && (i.type === itemType || i.media_type === itemType),
      );
      if (item) return { ...item, list: key, rating: data.ratings[`${itemType}:${itemId}`] ?? item.rating };
    }
    const rating = data.ratings[`${itemType}:${itemId}`];
    return rating ? { id: itemId, media_type: itemType, type: itemType, rating } : null;
  }, [data]);

  const syncToCloud = useCallback(async () => {
    if (!accessToken) {
      setLastSyncedAt(new Date().toISOString());
      return;
    }
    setIsSyncing(true);
    try {
      googleDriveService.init(accessToken);
      await googleDriveService.syncAll(data);
      setLastSyncedAt(new Date().toISOString());
    } finally {
      setIsSyncing(false);
    }
  }, [accessToken, data]);

  const items = useMemo(() => (
    [LIST_TYPES.WATCHLIST, LIST_TYPES.WATCHING, LIST_TYPES.COMPLETED, LIST_TYPES.DROPPED]
      .flatMap((list) => data[list].map((item) => ({
        ...item,
        list,
        type: item.type || item.media_type || 'movie',
        media_type: item.media_type || item.type || 'movie',
        rating: data.ratings[`${item.type || item.media_type}:${item.id}`] ?? item.rating ?? item.userRating ?? null,
      })))
  ), [data]);

  /**
   * Get the list an item currently belongs to, or null.
   * @param {string|number} itemId
   * @param {string} itemType
   * @returns {string|null}
   */
  const getItemStatus = useCallback(
    (itemId, itemType) => {
      for (const key of [LIST_TYPES.WATCHLIST, LIST_TYPES.WATCHING, LIST_TYPES.COMPLETED, LIST_TYPES.DROPPED]) {
        if (data[key].some((i) => String(i.id) === String(itemId) && i.type === itemType)) {
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
      isLoading: false,
      lastSyncedAt,
      lastSyncTime: lastSyncedAt,
      syncStatus: isSyncing ? 'syncing' : lastSyncedAt ? 'synced' : 'local',
      items,

      // Actions
      addToList,
      removeFromList,
      removeItem,
      moveItem,
      updateRating,
      getItem,
      syncToCloud,
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
      items,
      addToList,
      removeFromList,
      removeItem,
      moveItem,
      updateRating,
      getItem,
      syncToCloud,
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
