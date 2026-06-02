/**
 * @file Custom React hook for data fetching with caching,
 * race-condition handling via AbortController, and refetch support.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Simple in-memory cache shared across all useApi instances.
 * Keys are stringified dependency arrays; values include data + timestamp.
 * @type {Map<string, { data: any, timestamp: number }>}
 */
const cache = new Map();

/** Default cache TTL: 5 minutes */
const DEFAULT_TTL = 5 * 60 * 1000;

/**
 * useApi — a generic data-fetching hook.
 *
 * @param {(signal: AbortSignal) => Promise<any>} asyncFn
 *   The async function to call. Receives an AbortSignal so it can be cancelled.
 * @param {any[]} [deps=[]]
 *   Dependency array — the hook re-fetches whenever any dep changes.
 * @param {object} [options]
 * @param {boolean} [options.enabled=true] — set to false to skip fetching
 * @param {number} [options.ttl] — cache time-to-live in ms
 * @param {string} [options.cacheKey] — explicit cache key (auto-generated from deps if omitted)
 * @returns {{ data: any, loading: boolean, error: Error|null, refetch: () => void }}
 */
export function useApi(asyncFn, deps = [], options = {}) {
  const { enabled = true, ttl = DEFAULT_TTL, cacheKey } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /** Ref to track the latest AbortController so we can cancel stale requests. */
  const abortRef = useRef(null);
  /** Generation counter to guard against stale setState calls. */
  const generationRef = useRef(0);

  const key = cacheKey ?? JSON.stringify(deps);

  const fetchData = useCallback(
    async (skipCache = false) => {
      // Cancel any in-flight request
      if (abortRef.current) {
        abortRef.current.abort();
      }

      const controller = new AbortController();
      abortRef.current = controller;

      const gen = ++generationRef.current;

      // Check cache first
      if (!skipCache) {
        const cached = cache.get(key);
        if (cached && Date.now() - cached.timestamp < ttl) {
          setData(cached.data);
          setLoading(false);
          setError(null);
          return;
        }
      }

      setLoading(true);
      setError(null);

      try {
        const result = await asyncFn(controller.signal);

        // Only update state if this is still the latest request
        if (gen !== generationRef.current) return;

        cache.set(key, { data: result, timestamp: Date.now() });
        setData(result);
      } catch (err) {
        if (err.name === 'AbortError') return; // request was intentionally cancelled
        if (gen !== generationRef.current) return;
        setError(err);
      } finally {
        if (gen === generationRef.current) {
          setLoading(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, ttl, asyncFn],
  );

  // Auto-fetch when dependencies change
  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    fetchData();

    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);

  /** Force a fresh fetch, bypassing the cache. */
  const refetch = useCallback(() => fetchData(true), [fetchData]);

  return { data, loading, error, refetch };
}

export default useApi;
