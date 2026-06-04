import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

function ScrollToTop() {
  const { pathname, search, key } = useLocation();
  const navigationType = useNavigationType();
  const scrollPositions = useRef({});

  // Disable native scroll restoration so we can handle it manually
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    try {
      const stored = sessionStorage.getItem('cinescope_scroll');
      if (stored) scrollPositions.current = JSON.parse(stored);
    } catch (e) {}
  }, []);

  // Track scroll position for the current key
  useEffect(() => {
    let timeoutId = null;
    const handleScroll = () => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        scrollPositions.current[key] = window.scrollY;
        try {
          sessionStorage.setItem('cinescope_scroll', JSON.stringify(scrollPositions.current));
        } catch (e) {}
        timeoutId = null;
      }, 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [key]);

  // Restore or reset scroll on navigation
  useEffect(() => {
    if (navigationType === 'POP') {
      const savedScroll = scrollPositions.current[key];
      if (savedScroll !== undefined) {
        const restore = () => window.scrollTo({ top: savedScroll, left: 0, behavior: 'instant' });
        restore();
        // Safari needs multiple attempts due to async rendering/layout
        requestAnimationFrame(restore);
        setTimeout(restore, 50);
        setTimeout(restore, 150);
      }
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [navigationType, pathname, search, key]);

  return null;
}

export default ScrollToTop;
