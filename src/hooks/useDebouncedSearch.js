/**
 * @file Custom React hook for debounced search.
 * Manages the query string, debounces calls to the provided search function,
 * and exposes results + loading state.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { SEARCH_DEBOUNCE_MS } from '../utils/constants.js';

/**
 * useDebouncedSearch — fires a search function after the user stops typing.
 *
 * @param {(query: string) => Promise<any>} searchFn
 *   Async function that performs the actual search.
 * @param {number} [delay=SEARCH_DEBOUNCE_MS]
 *   Debounce delay in milliseconds.
 * @returns {{
 *   query: string,
 *   setQuery: (q: string) => void,
 *   results: any,
 *   loading: boolean,
 *   error: Error|null,
 *   clearResults: () => void,
 * }}
 */
export function useDebouncedSearch(searchFn, delay = SEARCH_DEBOUNCE_MS) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const timerRef = useRef(null);
  const abortRef = useRef(null);
  /** Tracks the latest search generation to discard stale responses. */
  const genRef = useRef(0);

  useEffect(() => {
    // Clear previous timer
    if (timerRef.current) clearTimeout(timerRef.current);

    // If query is empty, reset results immediately
    if (!query || !query.trim()) {
      setResults(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);

    timerRef.current = setTimeout(async () => {
      // Abort previous in-flight request
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const gen = ++genRef.current;

      try {
        const data = await searchFn(query.trim());
        if (gen !== genRef.current) return; // stale
        setResults(data);
        setError(null);
      } catch (err) {
        if (err.name === 'AbortError') return;
        if (gen !== genRef.current) return;
        setError(err);
      } finally {
        if (gen === genRef.current) setLoading(false);
      }
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, delay, searchFn]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const clearResults = useCallback(() => {
    setQuery('');
    setResults(null);
    setError(null);
    setLoading(false);
  }, []);

  return { query, setQuery, results, loading, error, clearResults };
}

export default useDebouncedSearch;
