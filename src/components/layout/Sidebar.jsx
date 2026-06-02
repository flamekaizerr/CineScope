import { memo, useCallback, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUserData } from '../../context/UserDataContext';
import {
  Home,
  Film,
  Tv,
  Sparkles,
  TrendingUp,
  Search,
  Wand2,
  Bookmark,
  User,
} from 'lucide-react';

const NAV_ITEMS_TOP = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/movies', label: 'Movies', icon: Film },
  { to: '/tv', label: 'TV Shows', icon: Tv },
  { to: '/anime', label: 'Anime', icon: Sparkles },
  { to: '/buzz', label: 'Buzz', icon: TrendingUp },
  { to: '/search', label: 'Search', icon: Search },
];

const NAV_ITEMS_MIDDLE = [
  { to: '/for-you', label: 'For You', icon: Wand2 },
  { to: '/watchlist', label: 'Watchlist', icon: Bookmark, showCount: true },
];

const NAV_ITEMS_BOTTOM = [
  { to: '/profile', label: 'Profile', icon: User },
];

/**
 * Sidebar – Desktop side navigation.
 * Supports collapsed/expanded state and a mobile overlay mode.
 */
function Sidebar({ collapsed, mobileOpen, onCloseMobile }) {
  const location = useLocation();
  const { watchlistCount } = useUserData();

  // Close mobile sidebar on route change
  useEffect(() => {
    if (mobileOpen && onCloseMobile) {
      onCloseMobile();
    }
    // Only run when location changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const isActive = useCallback(
    (to) => {
      if (to === '/') return location.pathname === '/';
      return location.pathname.startsWith(to);
    },
    [location.pathname]
  );

  const renderLink = useCallback(
    (item) => {
      const Icon = item.icon;
      const active = isActive(item.to);
      const classes = [
        'sidebar-link',
        active ? 'sidebar-link-active' : '',
      ]
        .filter(Boolean)
        .join(' ');

      return (
        <Link
          key={item.to}
          to={item.to}
          className={classes}
          aria-current={active ? 'page' : undefined}
          aria-label={item.label}
        >
          <Icon size={20} aria-hidden="true" />
          {!collapsed && <span className="sidebar-link-label">{item.label}</span>}
          {!collapsed && item.showCount && watchlistCount > 0 && (
            <span className="sidebar-badge" aria-label={`${watchlistCount} items`}>
              {watchlistCount > 99 ? '99+' : watchlistCount}
            </span>
          )}
        </Link>
      );
    },
    [collapsed, isActive, watchlistCount]
  );

  const sidebarClasses = [
    'sidebar',
    collapsed ? 'sidebar-collapsed' : '',
    mobileOpen ? 'sidebar-mobile-open' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}
      <aside className={sidebarClasses} role="navigation" aria-label="Sidebar navigation">
        <nav className="sidebar-nav">
          <div className="sidebar-group">
            {NAV_ITEMS_TOP.map(renderLink)}
          </div>
          <div className="sidebar-separator" role="separator" />
          <div className="sidebar-group">
            {NAV_ITEMS_MIDDLE.map(renderLink)}
          </div>
          <div className="sidebar-separator" role="separator" />
          <div className="sidebar-group">
            {NAV_ITEMS_BOTTOM.map(renderLink)}
          </div>
        </nav>
      </aside>
    </>
  );
}

export default memo(Sidebar);
