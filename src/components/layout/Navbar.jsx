import { useState, useCallback, useRef, useEffect, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  Bell,
  Menu,
  LogIn,
  LogOut,
  User,
  Settings,
  Telescope,
} from 'lucide-react';

/**
 * Navbar – Top navigation bar.
 * Desktop: logo + search bar + notifications + user avatar/dropdown.
 * Mobile: hamburger + logo + search icon.
 */
function Navbar({ onToggleMobileMenu }) {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  // Focus mobile search input when opened
  useEffect(() => {
    if (mobileSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [mobileSearchOpen]);

  const handleSearch = useCallback(
    (e) => {
      e.preventDefault();
      const trimmed = searchQuery.trim();
      if (trimmed) {
        navigate(`/search?q=${encodeURIComponent(trimmed)}`);
        setSearchQuery('');
        setMobileSearchOpen(false);
      }
    },
    [searchQuery, navigate]
  );

  const toggleDropdown = useCallback(() => {
    setDropdownOpen((prev) => !prev);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    setDropdownOpen(false);
  }, [logout]);

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      {/* Mobile: hamburger */}
      <button
        className="navbar-mobile-toggle"
        onClick={onToggleMobileMenu}
        aria-label="Toggle mobile menu"
      >
        <Menu size={22} />
      </button>

      {/* Logo */}
      <Link to="/" className="navbar-logo" aria-label="CineScope Home">
        <Telescope size={26} aria-hidden="true" />
        <span className="navbar-logo-text">CineScope</span>
      </Link>

      {/* Desktop search bar */}
      <form className="navbar-search" onSubmit={handleSearch} role="search">
        <Search size={18} className="navbar-search-icon" aria-hidden="true" />
        <input
          type="text"
          className="navbar-search-input"
          placeholder="Search movies, TV shows, anime…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search"
        />
        <kbd className="navbar-search-shortcut" aria-hidden="true">
          Ctrl+K
        </kbd>
      </form>

      {/* Actions */}
      <div className="navbar-actions">
        {/* Mobile search icon */}
        <button
          className="navbar-mobile-search"
          onClick={() => setMobileSearchOpen((prev) => !prev)}
          aria-label="Toggle search"
        >
          <Search size={20} />
        </button>

        {/* Notification bell */}
        <button className="navbar-notification" aria-label="Notifications">
          <Bell size={20} />
        </button>

        {/* User / Login */}
        {isAuthenticated ? (
          <div className="navbar-avatar-wrapper" ref={dropdownRef}>
            <button
              className="navbar-avatar"
              onClick={toggleDropdown}
              aria-haspopup="true"
              aria-expanded={dropdownOpen}
              aria-label="User menu"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name || 'User avatar'}
                  className="navbar-avatar-img"
                />
              ) : (
                <User size={20} aria-hidden="true" />
              )}
            </button>
            {dropdownOpen && (
              <div className="navbar-dropdown" role="menu">
                <div className="navbar-dropdown-header">
                  <span className="navbar-dropdown-name">
                    {user?.name || 'User'}
                  </span>
                  <span className="navbar-dropdown-email">
                    {user?.email || ''}
                  </span>
                </div>
                <Link
                  to="/profile"
                  className="navbar-dropdown-item"
                  role="menuitem"
                  onClick={() => setDropdownOpen(false)}
                >
                  <User size={16} aria-hidden="true" />
                  Profile
                </Link>
                <Link
                  to="/settings"
                  className="navbar-dropdown-item"
                  role="menuitem"
                  onClick={() => setDropdownOpen(false)}
                >
                  <Settings size={16} aria-hidden="true" />
                  Settings
                </Link>
                <button
                  className="navbar-dropdown-item"
                  role="menuitem"
                  onClick={handleLogout}
                >
                  <LogOut size={16} aria-hidden="true" />
                  Log out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login" className="navbar-login-btn" aria-label="Log in">
            <LogIn size={18} aria-hidden="true" />
            <span className="navbar-login-text">Login</span>
          </Link>
        )}
      </div>

      {/* Mobile search overlay */}
      {mobileSearchOpen && (
        <form
          className="navbar-mobile-search-overlay"
          onSubmit={handleSearch}
          role="search"
        >
          <Search size={18} aria-hidden="true" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search"
          />
          <button
            type="button"
            onClick={() => setMobileSearchOpen(false)}
            aria-label="Close search"
          >
            ✕
          </button>
        </form>
      )}
    </nav>
  );
}

export default memo(Navbar);
