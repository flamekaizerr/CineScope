import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { UserDataProvider } from './context/UserDataContext';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Movies from './pages/Movies';
import TvShows from './pages/TvShows';
import Anime from './pages/Anime';
import Buzz from './pages/Buzz';
import Detail from './pages/Detail';
import AnimeDetail from './pages/AnimeDetail';
import Search from './pages/Search';
import Watchlist from './pages/Watchlist';
import ForYou from './pages/ForYou';
import Profile from './pages/Profile';
import Login from './pages/Login';

/**
 * App — root router.
 *
 * Login renders OUTSIDE Layout (fullscreen, no navbar/sidebar).
 * All browsing routes work for guests.
 * Watchlist, For You, and Profile show a sign-in prompt for guests
 * (handled inside those pages themselves via useAuth).
 */
function App() {
  return (
    <AuthProvider>
      <UserDataProvider>
        <Router>
          <Routes>
            {/* ── Fullscreen route — no navbar/sidebar ── */}
            <Route path="/login" element={<Login />} />

            {/* ── All other routes inside the main Layout ── */}
            <Route
              path="/*"
              element={
                <Layout>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/movies" element={<Movies />} />
                    <Route path="/tv" element={<TvShows />} />
                    <Route path="/anime" element={<Anime />} />
                    <Route path="/buzz" element={<Buzz />} />
                    <Route path="/movie/:id" element={<Detail />} />
                    <Route path="/tv/:id" element={<Detail />} />
                    <Route path="/anime/:id" element={<AnimeDetail />} />
                    <Route path="/search" element={<Search />} />
                    {/* These pages handle their own guest prompt internally */}
                    <Route path="/watchlist" element={<Watchlist />} />
                    <Route path="/for-you" element={<ForYou />} />
                    <Route path="/profile" element={<Profile />} />
                    {/* Catch-all */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Layout>
              }
            />
          </Routes>
        </Router>
      </UserDataProvider>
    </AuthProvider>
  );
}

export default App;
