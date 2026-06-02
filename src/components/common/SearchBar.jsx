import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';

function SearchBar({ value, onChange, onSearch, placeholder = 'Search...', initialValue = '' }) {
  const isControlled = value !== undefined;
  const [internalQuery, setInternalQuery] = useState(initialValue);
  const inputRef = useRef(null);
  const debounceTimer = useRef(null);
  const query = isControlled ? value : internalQuery;

  useEffect(() => {
    if (!isControlled) {
      setInternalQuery(initialValue);
    }
  }, [initialValue, isControlled]);

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
  }, [initialValue, onSearch, query]);

  useEffect(() => {
    function handleKeyDown(event) {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleChange = useCallback((event) => {
    if (isControlled) {
      onChange?.(event.target.value);
    } else {
      setInternalQuery(event.target.value);
    }
  }, [isControlled, onChange]);

  const handleClear = useCallback(() => {
    if (isControlled) {
      onChange?.('');
    } else {
      setInternalQuery('');
    }
    onSearch?.('');
    inputRef.current?.focus();
  }, [isControlled, onChange, onSearch]);

  const handleSubmit = useCallback((event) => {
    event.preventDefault();
    onSearch?.(query);
  }, [onSearch, query]);

  return (
    <form className="search-bar" onSubmit={handleSubmit} role="search">
      <Search size={18} className="search-bar-icon" aria-hidden="true" />
      <input
        ref={inputRef}
        type="search"
        className="search-bar-input"
        placeholder={placeholder}
        value={query}
        onChange={handleChange}
        aria-label="Search"
      />
      {query.length > 0 ? (
        <button
          type="button"
          className="search-bar-clear"
          onClick={handleClear}
          aria-label="Clear search"
        >
          <X size={16} aria-hidden="true" />
        </button>
      ) : (
        <kbd className="search-bar-shortcut" aria-hidden="true">
          Ctrl+K
        </kbd>
      )}
    </form>
  );
}

export default memo(SearchBar);
