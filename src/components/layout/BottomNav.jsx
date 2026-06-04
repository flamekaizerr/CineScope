import { useCallback, memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Film,
  Tv,
  Sparkles,
  Clapperboard,
} from 'lucide-react';

const PRIMARY_ITEMS = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/movies', label: 'Movies', icon: Film },
  { to: '/tv', label: 'TV', icon: Tv },
  { to: '/anime', label: 'Anime', icon: Sparkles },
  { to: '/animation', label: 'Animation', icon: Clapperboard },
];

/**
 * BottomNav – Mobile bottom navigation bar.
 * Shows 5 main tabs.
 */
function BottomNav() {
  const location = useLocation();

  const isActive = useCallback(
    (to) => {
      if (to === '/') return location.pathname === '/';
      return location.pathname.startsWith(to);
    },
    [location.pathname]
  );

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
    </nav>
  );
}

export default memo(BottomNav);
