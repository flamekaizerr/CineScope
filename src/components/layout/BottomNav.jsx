import { useState, useCallback, useEffect, useRef, memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Film,
  Tv,
  Sparkles,
  Clapperboard,
  MoreHorizontal,
  TrendingUp,
  Wand2,
  Bookmark,
  User,
  X,
} from 'lucide-react';

const PRIMARY_ITEMS = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/movies', label: 'Movies', icon: Film },
  { to: '/tv', label: 'TV', icon: Tv },
  { to: '/anime', label: 'Anime', icon: Sparkles },
  { to: '/animation', label: 'Anim', icon: Clapperboard },
];

const MORE_ITEMS = [
  { to: '/buzz', label: 'Buzz', icon: TrendingUp },
  { to: '/for-you', label: 'For You', icon: Wand2 },
  { to: '/watchlist', label: 'Watchlist', icon: Bookmark },
  { to: '/profile', label: 'Profile', icon: User },
];

/**
 * BottomNav – Mobile bottom navigation bar.
 * Shows 5 main tabs (Home, Movies, TV, Anime, More).
 * "More" expands a popup with additional links.
 */
function BottomNav() {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);

  const isActive = useCallback(
    (to) => {
      if (to === '/') return location.pathname === '/';
      return location.pathname.startsWith(to);
    },
    [location.pathname]
  );

  const isMoreActive = MORE_ITEMS.some((item) => isActive(item.to));

  // Close "More" menu on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setMoreOpen(false);
      }
    }
    if (moreOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [moreOpen]);

  // Close on route change
  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname]);

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Mobile navigation">
      {PRIMARY_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            className={`bottom-nav-item ${active ? 'bottom-nav-item-active' : ''}`}
            aria-current={active ? 'page' : undefined}
            aria-label={item.label}
          >
            <Icon size={22} aria-hidden="true" />
            <span className="bottom-nav-label">{item.label}</span>
          </Link>
        );
      })}

      {/* More button */}
      <div className="bottom-nav-more-wrapper" ref={moreRef}>
        <button
          className={`bottom-nav-item ${isMoreActive ? 'bottom-nav-item-active' : ''}`}
          onClick={() => setMoreOpen((prev) => !prev)}
          aria-haspopup="true"
          aria-expanded={moreOpen}
          aria-label="More options"
        >
          {moreOpen ? (
            <X size={22} aria-hidden="true" />
          ) : (
            <MoreHorizontal size={22} aria-hidden="true" />
          )}
          <span className="bottom-nav-label">More</span>
        </button>

        {moreOpen && (
          <div className="bottom-nav-more-menu" role="menu">
            {MORE_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`bottom-nav-more-item ${active ? 'bottom-nav-more-item-active' : ''}`}
                  role="menuitem"
                  aria-label={item.label}
                >
                  <Icon size={20} aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}

export default memo(BottomNav);
