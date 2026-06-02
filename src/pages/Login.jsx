import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Film, Tv, Sparkles, Cloud, Shield, BarChart3,
  Bookmark, Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  {
    icon: Bookmark,
    title: 'Track Everything',
    description: 'Build your watchlist across movies, TV shows, and anime in one place.',
  },
  {
    icon: Zap,
    title: 'AI Recommendations',
    description: 'Get personalized suggestions powered by Google Gemini AI.',
  },
  {
    icon: Cloud,
    title: 'Cloud Sync',
    description: 'Your data is stored securely on your Google Drive — accessible anywhere.',
  },
  {
    icon: BarChart3,
    title: 'Viewing Stats',
    description: 'See your viewing habits, favorite genres, and rating patterns.',
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'No servers, no databases. Your data lives on your own Google Drive.',
  },
  {
    icon: Film,
    title: 'All-in-One Hub',
    description: 'Movies, TV shows, and anime with TMDB, Trakt, and Jikan integration.',
  },
];

function Login() {
  const { loginWithGoogle, loading } = useAuth();
  const navigate = useNavigate();

  const handleGoogleLogin = useCallback(async () => {
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (err) {
      console.error('Login failed:', err);
    }
  }, [loginWithGoogle, navigate]);

  return (
    <div className="page login-page">
      {/* Animated Background */}
      <div className="login-bg-animation">
        <div className="login-bg-circle login-bg-circle-1" />
        <div className="login-bg-circle login-bg-circle-2" />
        <div className="login-bg-circle login-bg-circle-3" />
      </div>

      <div className="login-content">
        {/* Logo & Tagline */}
        <div className="login-header">
          <div className="login-logo">
            <Film size={40} />
            <Tv size={32} className="login-logo-tv" />
            <Sparkles size={24} className="login-logo-sparkle" />
          </div>
          <h1 className="login-title">CineScope</h1>
          <p className="login-tagline">
            Your all-in-one entertainment hub for movies, TV shows, and anime.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="login-features">
          {FEATURES.map((feature, index) => (
            <div key={index} className="login-feature">
              <div className="login-feature-icon">
                <feature.icon size={22} />
              </div>
              <div className="login-feature-text">
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Sign In Button */}
        <div className="login-actions">
          <button
            className="btn btn-google"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </button>
        </div>

        {/* Why Sign In */}
        <div className="login-why">
          <h3>Why sign in?</h3>
          <p>
            Signing in lets you save your watchlist, track your viewing history,
            get personalized AI recommendations, and sync your data across all your devices.
          </p>
        </div>

        {/* Privacy Note */}
        <div className="login-privacy">
          <Shield size={16} />
          <p>
            We respect your privacy. CineScope stores all your data on your personal
            Google Drive — we never store your information on our servers. You're always
            in control of your data.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
