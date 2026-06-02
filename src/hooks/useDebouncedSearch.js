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
export function useDebouncedSearch(searchFnOrInitialValue = '', delay = SEARCH_DEBOUNCE_MS) {
  const hasSearchFn = typeof searchFnOrInitialValue === 'function';
  const initialValue = hasSearchFn ? '' : String(searchFnOrInitialValue || '');
  const [query, setQuery] = useState(initialValue);
  const [debouncedQuery, setDebouncedQuery] = useState(initialValue);
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
      setDebouncedQuery('');
      setResults(null);
      setLoading(false);
      setError(null);
      return;
    }

    if (!hasSearchFn) {
      timerRef.current = setTimeout(() => {
        setDebouncedQuery(query.trim());
      }, delay);
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }

    setLoading(true);

    timerRef.current = setTimeout(async () => {
      // Abort previous in-flight request
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const gen = ++genRef.current;

      try {
        const data = await searchFnOrInitialValue(query.trim());
        if (gen !== genRef.current) return; // stale
        setDebouncedQuery(query.trim());
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
  }, [query, delay, hasSearchFn, searchFnOrInitialValue]);

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

  return { query, setQuery, debouncedQuery, results, loading, error, clearResults };
}

export default useDebouncedSearch;
