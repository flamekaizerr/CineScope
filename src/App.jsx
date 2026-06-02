import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

function App() {
  return (
    <AuthProvider>
      <UserDataProvider>
        <Router>
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
              <Route path="/watchlist" element={<Watchlist />} />
              <Route path="/for-you" element={<ForYou />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/login" element={<Login />} />
            </Routes>
          </Layout>
        </Router>
      </UserDataProvider>
    </AuthProvider>
  );
}

export default App;
