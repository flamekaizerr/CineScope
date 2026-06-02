import { useState, useCallback, useRef, useEffect, memo } from 'react';
import { Search, X } from 'lucide-react';

/**
 * SearchBar – Search input with icon, clear button, debounce, and keyboard shortcut hint.
 */
function SearchBar({ onSearch, placeholder = 'Search…', initialValue = '' }) {
  const [query, setQuery] = useState(initialValue);
  const inputRef = useRef(null);
  const debounceTimer = useRef(null);

  // Sync initialValue changes
  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  // Debounced callback
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      if (onSearch && query !== initialValue) {
        onSearch(query);
      }
    }, 350);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Global Ctrl+K shortcut
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleChange = useCallback((e) => {
    setQuery(e.target.value);
  }, []);

  const handleClear = useCallback(() => {
    setQuery('');
    if (onSearch) onSearch('');
    inputRef.current?.focus();
  }, [onSearch]);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (onSearch) onSearch(query);
    },
    [onSearch, query]
  );

  return (
    <form className="search-bar" onSubmit={handleSubmit} role="search">
      <Search size={18} className="search-bar-icon" aria-hidden="true" />
      <input
        ref={inputRef}
        type="text"
        className="search-bar-input"
        placeholder={placeholder}
        value={query}
        onChange={handleChange}
        aria-label="Search"
      />
      {query.length > 0 && (
        <button
          type="button"
          className="search-bar-clear"
          onClick={handleClear}
          aria-label="Clear search"
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}
      <kbd className="search-bar-shortcut" aria-hidden="true">
        Ctrl+K
      </kbd>
    </form>
  );
}

export default memo(SearchBar);
