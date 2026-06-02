import { useState, useCallback } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

/**
 * Layout – Main application layout wrapper.
 * Renders the Navbar at top, Sidebar on desktop (left side),
 * main content area in the center, and BottomNav on mobile.
 */
function Layout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  return (
    <div className="layout">
      <Navbar
        onToggleSidebar={toggleSidebar}
        onToggleMobileMenu={toggleMobileMenu}
      />
      <div className="layout-main">
        <Sidebar
          collapsed={sidebarCollapsed}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={closeMobileMenu}
        />
        <main className="layout-content" role="main">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

export default Layout;
