import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { UserDataProvider } from './context/UserDataContext';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import TrendingToday from './pages/TrendingToday';
import Movies from './pages/Movies';
import TvShows from './pages/TvShows';
import Anime from './pages/Anime';
import Animation from './pages/Animation';
import Buzz from './pages/Buzz';
import Detail from './pages/Detail';
import AnimeDetail from './pages/AnimeDetail';
import Search from './pages/Search';
import Watchlist from './pages/Watchlist';
import ForYou from './pages/ForYou';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import Login from './pages/Login';
import ScrollToTop from './components/common/ScrollToTop';
import { lazy, Suspense } from 'react';

const Prism = lazy(() => import('./pages/Prism'));

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UserDataProvider>
          <Router>
            <ScrollToTop />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/*"
                element={
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/trending" element={<TrendingToday />} />
                      <Route path="/movies" element={<Movies />} />
                      <Route path="/tv" element={<TvShows />} />
                      <Route path="/anime" element={<Anime />} />
                      <Route path="/animation" element={<Animation />} />
                      <Route path="/buzz" element={<Buzz />} />
                      <Route path="/movie/:id" element={<Detail />} />
                      <Route path="/tv/:id" element={<Detail />} />
                      <Route path="/anime/:id" element={<AnimeDetail />} />
                      <Route path="/search" element={<Search />} />
                      <Route path="/watchlist" element={<Watchlist />} />
                      <Route path="/for-you" element={<ForYou />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/prism" element={
                        <Suspense fallback={null}>
                          <Prism />
                        </Suspense>
                      } />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Layout>
                }
              />
            </Routes>
          </Router>
        </UserDataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
