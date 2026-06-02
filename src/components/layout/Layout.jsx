import Navbar from './Navbar';
import BottomNav from './BottomNav';

function Layout({ children }) {
  return (
    <div className="layout">
      <Navbar />
      <div className="layout-main">
        <main className="layout-content" role="main">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

export default Layout;
