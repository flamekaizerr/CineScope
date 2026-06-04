import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Bookmark, Clapperboard, Compass, Film, LogIn, LogOut, Menu, Moon, Search, Sparkles, Sun, Telescope, Tv, User, Wand2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const NAV_ITEMS = [
  { to: '/movies', label: 'Movies', icon: Film },
  { to: '/tv', label: 'TV Shows', icon: Tv },
  { to: '/anime', label: 'Anime', icon: Sparkles },
  { to: '/animation', label: 'Animation', icon: Clapperboard },
  { to: '/buzz', label: 'Buzz', icon: Compass },
  { to: '/for-you', label: 'For You', icon: Wand2 },
];



function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const userMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    }

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  useEffect(() => {
    if (searchOverlayOpen) {
      try {
        const stored = localStorage.getItem('cinescope_recent_searches');
        setRecentSearches(stored ? JSON.parse(stored) : []);
      } catch {
        setRecentSearches([]);
      }
    }
  }, [searchOverlayOpen]);

  useEffect(() => {
    if (!searchOverlayOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSearchOverlayOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchOverlayOpen]);

  const handleOverlaySearch = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    navigate(`/search?q=${encodeURIComponent(query)}`);
    setSearchQuery('');
    setSearchOverlayOpen(false);
  };

  const handleRecentTap = (term) => {
    navigate(`/search?q=${encodeURIComponent(term)}`);
    setSearchQuery('');
    setSearchOverlayOpen(false);
  };

  const handleClearRecent = () => {
    localStorage.removeItem('cinescope_recent_searches');
    setRecentSearches([]);
  };

  const handleSearch = useCallback((event) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    navigate(`/search?q=${encodeURIComponent(query)}`);
    setSearchQuery('');
    setMobileOpen(false);
  }, [navigate, searchQuery]);

  const handleLogout = useCallback(() => {
    logout();
    setUserMenuOpen(false);
    setMobileOpen(false);
  }, [logout]);

  const renderNavLinks = (className) => (
    <div className={className}>
      <NavLink to="/" className={({ isActive }) => `stream-nav-link ${isActive ? 'stream-nav-link-active' : ''}`} onClick={() => setMobileOpen(false)}>
        Home
      </NavLink>
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `stream-nav-link ${isActive ? 'stream-nav-link-active' : ''}`}
          onClick={() => setMobileOpen(false)}
        >
          <Icon size={16} aria-hidden="true" />
          {label}
        </NavLink>
      ))}
    </div>
  );

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo" aria-label="CineScope Home" onClick={() => setMobileOpen(false)}>
          <span className="navbar-logo-mark">
            <Telescope size={20} aria-hidden="true" />
          </span>
          <span className="navbar-logo-text">CineScope</span>
        </Link>

        {renderNavLinks('stream-nav-links')}

        <form className="navbar-search" onSubmit={handleSearch} role="search">
          <Search size={18} className="navbar-search-icon" aria-hidden="true" />
          <input
            type="search"
            className="navbar-search-input"
            placeholder="Search movies, shows, anime"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            aria-label="Search movies, TV shows, and anime"
          />
        </form>

        <div className="navbar-actions">
          <button
            className="navbar-icon-btn theme-mode-btn"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? <Sun size={19} aria-hidden="true" /> : <Moon size={19} aria-hidden="true" />}
          </button>

          <Link to="/watchlist" className="navbar-icon-btn" aria-label="Watchlist">
            <Bookmark size={19} aria-hidden="true" />
          </Link>

          <button className="navbar-icon-btn navbar-search-mobile-btn" onClick={() => setSearchOverlayOpen(true)} aria-label="Search">
            <Search size={19} aria-hidden="true" />
          </button>

          {isAuthenticated ? (
            <div className="navbar-avatar-wrapper" ref={userMenuRef}>
              <button
                className="navbar-avatar"
                onClick={() => setUserMenuOpen((open) => !open)}
                aria-haspopup="true"
                aria-expanded={userMenuOpen}
                aria-label="User menu"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name || 'User'} className="navbar-avatar-img" />
                ) : (
                  <User size={18} aria-hidden="true" />
                )}
              </button>
              {userMenuOpen && (
                <div className="navbar-dropdown" role="menu">
                  <div className="navbar-dropdown-header">
                    <span className="navbar-dropdown-name">{user?.name || 'User'}</span>
                    <span className="navbar-dropdown-email">{user?.email || 'Signed in'}</span>
                  </div>
                  <Link to="/profile" className="navbar-dropdown-item" role="menuitem" onClick={() => setUserMenuOpen(false)}>
                    <User size={16} aria-hidden="true" />
                    Profile
                  </Link>
                  <button className="navbar-dropdown-item" role="menuitem" onClick={handleLogout}>
                    <LogOut size={16} aria-hidden="true" />
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="navbar-login-btn navbar-login-desktop">
              <LogIn size={17} aria-hidden="true" />
              Login
            </Link>
          )}

          <button
            className="navbar-mobile-toggle"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label="Toggle navigation"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>
      </div>



      {mobileOpen && (
        <div className="navbar-mobile-panel">
          {renderNavLinks('stream-nav-links-mobile')}
          <div className="navbar-mobile-actions">
            <Link to="/watchlist" onClick={() => setMobileOpen(false)}>
              <Bookmark size={17} aria-hidden="true" />
              Watchlist
            </Link>
            <Link to="/profile" onClick={() => setMobileOpen(false)}>
              <User size={17} aria-hidden="true" />
              Profile
            </Link>
            {!isAuthenticated && (
              <Link to="/login" onClick={() => setMobileOpen(false)}>
                <LogIn size={17} aria-hidden="true" />
                Login
              </Link>
            )}
          </div>
        </div>
      )}

      {searchOverlayOpen && (
        <div className="search-overlay">
          <div className="search-overlay-header">
            <button
              className="search-overlay-close"
              onClick={() => setSearchOverlayOpen(false)}
              aria-label="Close search"
            >
              <X size={22} />
            </button>
            <form onSubmit={handleOverlaySearch} className="search-overlay-form" role="search">
              <Search size={18} aria-hidden="true" />
              <input
                type="search"
                autoFocus
                placeholder="Search movies, shows, anime..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search"
              />
            </form>
          </div>

          <div className="search-overlay-body">
            {recentSearches.length > 0 && (
              <div className="search-overlay-section">
                <div className="search-overlay-section-header">
                  <span>Recent</span>
                  <button onClick={handleClearRecent}>Clear</button>
                </div>
                <div className="search-overlay-chips">
                  {recentSearches.map((term) => (
                    <button key={term} onClick={() => handleRecentTap(term)}>
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default memo(Navbar);
