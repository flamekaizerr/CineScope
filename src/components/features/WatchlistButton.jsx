import { useState, useCallback, useRef, useEffect, memo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useUserData } from '../../context/UserDataContext';
import { LIST_TYPES } from '../../utils/constants';
import {
  Bookmark,
  Play,
  CheckCircle,
  XCircle,
  ChevronDown,
  LogIn,
} from 'lucide-react';

const LIST_OPTIONS = [
  { type: LIST_TYPES.WATCHLIST, label: 'Watchlist', icon: Bookmark },
  { type: LIST_TYPES.WATCHING, label: 'Watching', icon: Play },
  { type: LIST_TYPES.COMPLETED, label: 'Completed', icon: CheckCircle },
  { type: LIST_TYPES.DROPPED, label: 'Dropped', icon: XCircle },
];

/**
 * WatchlistButton – Add-to-list button with dropdown.
 * Shows current status if the item is already in a list.
 * Requires login — shows a login prompt if not authenticated.
 */
function WatchlistButton({ item, mediaType }) {
  const { isAuthenticated } = useAuth();
  const { addToList, removeFromList, getItemStatus } = useUserData();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const wrapperRef = useRef(null);

  const currentStatus = item ? getItemStatus(item.id, mediaType) : null;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setDropdownOpen(false);
        setShowLoginPrompt(false);
      }
    }
    if (dropdownOpen || showLoginPrompt) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen, showLoginPrompt]);

  const handleToggle = useCallback(() => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    setDropdownOpen((prev) => !prev);
  }, [isAuthenticated]);

  const handleSelect = useCallback(
    (listType) => {
      if (!item) return;
      if (currentStatus === listType) {
        // Remove if clicking the same status
        removeFromList(listType, item.id, mediaType);
      } else {
        addToList(listType, { ...item, mediaType });
      }
      setDropdownOpen(false);
    },
    [item, mediaType, currentStatus, addToList, removeFromList]
  );

  if (!item) return null;

  const currentOption = LIST_OPTIONS.find((o) => o.type === currentStatus);
  const CurrentIcon = currentOption ? currentOption.icon : Bookmark;
  const buttonLabel = currentOption ? currentOption.label : 'Add to List';

  return (
    <div className="watchlist-btn-wrapper" ref={wrapperRef}>
      <button
        className={`watchlist-btn ${currentStatus ? 'watchlist-btn-added' : ''}`}
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={dropdownOpen}
        aria-label={buttonLabel}
      >
        <CurrentIcon size={18} aria-hidden="true" />
        <span className="watchlist-btn-label">{buttonLabel}</span>
        <ChevronDown size={14} aria-hidden="true" />
      </button>

      {/* Dropdown */}
      {dropdownOpen && (
        <div className="watchlist-dropdown" role="listbox" aria-label="List options">
          {LIST_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isActive = currentStatus === option.type;
            return (
              <button
                key={option.type}
                className={`watchlist-option ${isActive ? 'watchlist-option-active' : ''}`}
                role="option"
                aria-selected={isActive}
                onClick={() => handleSelect(option.type)}
              >
                <Icon size={16} aria-hidden="true" />
                <span>{option.label}</span>
                {isActive && <CheckCircle size={14} className="watchlist-option-check" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Login prompt */}
      {showLoginPrompt && (
        <div className="watchlist-dropdown watchlist-login-prompt" role="alert">
          <LogIn size={20} aria-hidden="true" />
          <p>Please log in to add items to your list.</p>
          <a href="/login" className="watchlist-login-link">
            Log in
          </a>
        </div>
      )}
    </div>
  );
}

export default memo(WatchlistButton);
