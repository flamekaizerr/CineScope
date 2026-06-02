import { useState, useMemo, useCallback } from 'react';
import {
  User, RefreshCw, Moon, Sun, HardDrive,
  Film, Tv, Sparkles, Star, BarChart3, Clock,
  CheckCircle, Shield, Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUserData } from '../context/UserDataContext';
import LoadingSkeleton from '../components/common/LoadingSkeleton';

function Profile() {
  const { user, isLoading: authLoading } = useAuth();
  const { items, syncStatus, lastSyncTime, syncToCloud, isLoading: dataLoading } = useUserData();
  const [syncing, setSyncing] = useState(false);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('cinescope_theme') || 'dark';
    } catch {
      return 'dark';
    }
  });

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try {
      await syncToCloud();
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setSyncing(false);
    }
  }, [syncToCloud]);

  const handleThemeToggle = useCallback(() => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    try {
      localStorage.setItem('cinescope_theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
    } catch {
      // Silently fail
    }
  }, [theme]);

  // Viewing Statistics
  const stats = useMemo(() => {
    const allItems = items || [];
    const total = allItems.length;
    const watchlistCount = allItems.filter((i) => i.list === 'watchlist').length;
    const completedCount = allItems.filter((i) => i.list === 'completed').length;
    const watchingCount = allItems.filter((i) => i.list === 'watching').length;
    const droppedCount = allItems.filter((i) => i.list === 'dropped').length;

    const movies = allItems.filter((i) => i.media_type === 'movie').length;
    const tvShows = allItems.filter((i) => i.media_type === 'tv').length;
    const anime = allItems.filter((i) => i.media_type === 'anime').length;

    const ratedItems = allItems.filter((i) => i.rating > 0);
    const avgRating = ratedItems.length > 0
      ? (ratedItems.reduce((sum, i) => sum + i.rating, 0) / ratedItems.length).toFixed(1)
      : 0;

    // Genre frequency
    const genreCount = {};
    allItems.forEach((item) => {
      if (item.genres) {
        item.genres.forEach((genre) => {
          const name = typeof genre === 'string' ? genre : genre.name;
          if (name) {
            genreCount[name] = (genreCount[name] || 0) + 1;
          }
        });
      }
    });
    const topGenres = Object.entries(genreCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const maxGenreCount = topGenres.length > 0 ? topGenres[0][1] : 1;

    return {
      total, watchlistCount, completedCount, watchingCount, droppedCount,
      movies, tvShows, anime, avgRating, topGenres, maxGenreCount,
    };
  }, [items]);

  if (authLoading || dataLoading) {
    return (
      <div className="page profile-page">
        <LoadingSkeleton type="page" />
      </div>
    );
  }

  return (
    <div className="page profile-page">
      <div className="page-header">
        <h1>Profile</h1>
      </div>

      <div className="page-content">
        {/* User Info */}
        <section className="section profile-user-section">
          <div className="profile-user-card">
            <div className="profile-avatar">
              {user?.picture ? (
                <img src={user.picture} alt={user.name} className="profile-avatar-img" />
              ) : (
                <div className="profile-avatar-placeholder">
                  <User size={32} />
                </div>
              )}
            </div>
            <div className="profile-user-info">
              <h2 className="profile-name">{user?.name || 'Guest Explorer'}</h2>
              <p className="profile-email">{user?.email || 'Local profile. Google sync is planned for later.'}</p>
            </div>
          </div>
        </section>

        {/* Drive Sync */}
        <section className="section">
          <h2 className="section-title">
            <HardDrive size={20} /> Cloud Sync
          </h2>
          <div className="sync-card">
            <div className="sync-status">
              <div className={`sync-indicator ${syncStatus === 'synced' ? 'sync-ok' : 'sync-pending'}`}>
                <CheckCircle size={16} />
                <span>
                  {syncStatus === 'synced' ? 'Synced' : syncStatus === 'syncing' ? 'Syncing...' : 'Not synced'}
                </span>
              </div>
              {lastSyncTime && (
                <span className="sync-time">
                  <Clock size={12} /> Last synced: {new Date(lastSyncTime).toLocaleString()}
                </span>
              )}
            </div>
            <button
              className="btn btn-secondary sync-btn"
              onClick={handleSync}
              disabled={syncing}
            >
              <RefreshCw size={16} className={syncing ? 'spinner' : ''} />
              {syncing ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>
        </section>

        {/* Viewing Statistics */}
        <section className="section">
          <h2 className="section-title">
            <BarChart3 size={20} /> Viewing Statistics
          </h2>

          <div className="stat-cards-row">
            <div className="stat-card">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total Tracked</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.completedCount}</div>
              <div className="stat-label">Completed</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.watchlistCount}</div>
              <div className="stat-label">Watchlist</div>
            </div>
            <div className="stat-card">
              <Star size={16} />
              <div className="stat-value">{stats.avgRating}</div>
              <div className="stat-label">Avg Rating</div>
            </div>
          </div>

          {/* Content Breakdown */}
          <div className="profile-breakdown">
            <h3>Content Breakdown</h3>
            <div className="breakdown-bars">
              <div className="breakdown-item">
                <div className="breakdown-label">
                  <Film size={14} /> Movies
                </div>
                <div className="breakdown-bar">
                  <div
                    className="breakdown-fill breakdown-movies"
                    style={{ width: stats.total ? `${(stats.movies / stats.total) * 100}%` : '0%' }}
                  />
                </div>
                <span className="breakdown-count">{stats.movies}</span>
              </div>
              <div className="breakdown-item">
                <div className="breakdown-label">
                  <Tv size={14} /> TV Shows
                </div>
                <div className="breakdown-bar">
                  <div
                    className="breakdown-fill breakdown-tv"
                    style={{ width: stats.total ? `${(stats.tvShows / stats.total) * 100}%` : '0%' }}
                  />
                </div>
                <span className="breakdown-count">{stats.tvShows}</span>
              </div>
              <div className="breakdown-item">
                <div className="breakdown-label">
                  <Sparkles size={14} /> Anime
                </div>
                <div className="breakdown-bar">
                  <div
                    className="breakdown-fill breakdown-anime"
                    style={{ width: stats.total ? `${(stats.anime / stats.total) * 100}%` : '0%' }}
                  />
                </div>
                <span className="breakdown-count">{stats.anime}</span>
              </div>
            </div>
          </div>

          {/* Favorite Genres */}
          {stats.topGenres.length > 0 && (
            <div className="profile-genres">
              <h3>Favorite Genres</h3>
              <div className="genre-bars">
                {stats.topGenres.map(([name, count]) => (
                  <div key={name} className="genre-bar-item">
                    <span className="genre-bar-label">{name}</span>
                    <div className="genre-bar">
                      <div
                        className="genre-bar-fill"
                        style={{ width: `${(count / stats.maxGenreCount) * 100}%` }}
                      />
                    </div>
                    <span className="genre-bar-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Theme Toggle */}
        <section className="section">
          <h2 className="section-title">Appearance</h2>
          <div className="theme-toggle-card">
            <div className="theme-info">
              {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
              <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
            </div>
            <button className="theme-toggle-btn" onClick={handleThemeToggle}>
              <div className={`theme-toggle-track ${theme === 'light' ? 'theme-toggle-light' : ''}`}>
                <div className="theme-toggle-thumb" />
              </div>
            </button>
          </div>
        </section>

        {/* App Info */}
        <section className="section">
          <h2 className="section-title">
            <Info size={20} /> About
          </h2>
          <div className="app-info-card">
            <div className="app-info-row">
              <span>Version</span>
              <span>1.0.0</span>
            </div>
            <div className="app-info-row">
              <span>Data Source</span>
              <span>TMDB, Jikan, Trakt</span>
            </div>
            <div className="app-info-row">
              <span>AI Engine</span>
              <span>Google Gemini</span>
            </div>
            <div className="app-info-row">
              <span>Storage</span>
              <span>
                <Shield size={12} /> Local first; Google Drive planned
              </span>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

export default Profile;
