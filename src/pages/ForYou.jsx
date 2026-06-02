import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, RefreshCw, Lightbulb, Film, Tv, Zap, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUserData } from '../context/UserDataContext';
import { useApi } from '../hooks/useApi';
import * as gemini from '../services/gemini';
import * as tmdb from '../services/tmdb';
import MediaCard from '../components/common/MediaCard';
import ContentRow from '../components/common/ContentRow';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import AiRecommendations from '../components/features/AiRecommendations';

function ForYou() {
  const { user, loading: authLoading } = useAuth();
  const { items, loading: dataLoading } = useUserData();
  const [recommendations, setRecommendations] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Trending fallback
  const {
    data: trendingFallback,
    loading: trendingLoading,
  } = useApi(() => tmdb.getTrending('all', 'week'), []);

  // Fetch AI recommendations
  const fetchRecommendations = useCallback(async () => {
    if (!user || !items || items.length === 0) return;

    setAiLoading(true);
    setAiError(null);

    try {
      const completedItems = items.filter((i) => i.list === 'completed' || i.rating > 0);
      const watchlistItems = items.filter((i) => i.list === 'watchlist');
      const userProfile = {
        completed: completedItems.map((i) => ({
          title: i.title,
          rating: i.rating,
          media_type: i.media_type,
        })),
        watchlist: watchlistItems.map((i) => ({
          title: i.title,
          media_type: i.media_type,
        })),
      };

      const result = await gemini.getRecommendations(userProfile);
      setRecommendations(result);
    } catch (err) {
      console.error('Failed to get AI recommendations:', err);
      setAiError('Unable to generate recommendations right now. Showing trending content instead.');
    } finally {
      setAiLoading(false);
    }
  }, [user, items]);

  useEffect(() => {
    if (user && items && items.length > 0) {
      fetchRecommendations();
    }
  }, [user, items?.length, refreshKey, fetchRecommendations]);

  const handleRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  // Not logged in
  if (!authLoading && !user) {
    return (
      <div className="page foryou-page">
        <div className="auth-prompt">
          <Sparkles size={48} />
          <h2>Personalized Recommendations</h2>
          <p>
            Sign in and rate some titles to get AI-powered recommendations tailored to your taste.
          </p>
          <Link to="/login" className="btn btn-primary">Sign In to Get Started</Link>
        </div>
      </div>
    );
  }

  if (authLoading || dataLoading) {
    return (
      <div className="page foryou-page">
        <LoadingSkeleton type="page" />
      </div>
    );
  }

  // Not enough data
  const hasEnoughData = items && items.length >= 3;

  const trendingItems = trendingFallback?.results || [];
  const personalizedPicks = recommendations?.personalizedPicks || [];
  const becauseYouWatched = recommendations?.becauseYouWatched || [];
  const basedOnTaste = recommendations?.basedOnTaste || [];

  return (
    <div className="page foryou-page">
      <div className="page-header">
        <div className="page-title-row">
          <Sparkles size={28} />
          <h1>For You</h1>
          {hasEnoughData && !aiLoading && (
            <button className="btn btn-icon refresh-btn" onClick={handleRefresh} title="Get new recommendations">
              <RefreshCw size={18} />
            </button>
          )}
        </div>
        <p className="page-subtitle">
          AI-powered recommendations tailored to your viewing history and preferences.
        </p>
      </div>

      <div className="page-content">
        {/* AI Loading State */}
        {aiLoading && (
          <div className="ai-loading-state">
            <div className="ai-loading-animation">
              <Loader size={32} className="spinner" />
              <Sparkles size={20} className="ai-sparkle" />
            </div>
            <h3>Analyzing your taste...</h3>
            <p>Our AI is looking at your ratings and watchlist to find perfect matches.</p>
            <div className="ai-loading-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <LoadingSkeleton key={i} type="card" animated />
              ))}
            </div>
          </div>
        )}

        {/* AI Error - Show fallback */}
        {aiError && !aiLoading && (
          <div className="ai-error-banner">
            <Lightbulb size={20} />
            <p>{aiError}</p>
          </div>
        )}

        {/* Not enough data */}
        {!hasEnoughData && !aiLoading && (
          <section className="section">
            <div className="not-enough-data">
              <Zap size={32} />
              <h3>Help us learn your taste</h3>
              <p>
                Rate at least 3 titles to unlock personalized AI recommendations.
                You've rated {items?.filter((i) => i.rating > 0).length || 0} so far.
              </p>
              <Link to="/" className="btn btn-primary">Explore & Rate Content</Link>
            </div>
          </section>
        )}

        {/* AI Recommendations */}
        {recommendations && !aiLoading && hasEnoughData && (
          <AiRecommendations recommendations={recommendations} />
        )}

        {/* Personalized Picks */}
        {personalizedPicks.length > 0 && !aiLoading && (
          <section className="section">
            <div className="section-header">
              <div className="section-title">
                <Sparkles size={20} />
                <h2>Your Personalized Picks</h2>
              </div>
            </div>
            <div className="media-grid">
              {personalizedPicks.map((item, i) => (
                <div key={`pick-${item.id || i}`} className="recommendation-card">
                  <MediaCard item={item} mediaType={item.media_type} />
                  {item.reason && (
                    <div className="recommendation-reason">
                      <Lightbulb size={12} />
                      <span>{item.reason}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Because You Watched */}
        {becauseYouWatched.length > 0 && !aiLoading && (
          <>
            {becauseYouWatched.map((group, groupIndex) => (
              <section key={`group-${groupIndex}`} className="section">
                <div className="section-header">
                  <div className="section-title">
                    <Film size={20} />
                    <h2>Because you watched {group.title}</h2>
                  </div>
                </div>
                {group.recommendations?.length > 0 ? (
                  <ContentRow items={group.recommendations} />
                ) : (
                  <p className="empty-message">No recommendations for this title.</p>
                )}
              </section>
            ))}
          </>
        )}

        {/* Based on Taste */}
        {basedOnTaste.length > 0 && !aiLoading && (
          <section className="section">
            <div className="section-header">
              <div className="section-title">
                <Zap size={20} />
                <h2>Based on Your Taste</h2>
              </div>
            </div>
            <div className="media-grid">
              {basedOnTaste.map((item, i) => (
                <div key={`taste-${item.id || i}`} className="recommendation-card">
                  <MediaCard item={item} mediaType={item.media_type} />
                  {item.reason && (
                    <div className="recommendation-reason">
                      <Lightbulb size={12} />
                      <span>{item.reason}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Fallback: Trending */}
        {(!recommendations || aiError) && !aiLoading && (
          <section className="section">
            <div className="section-header">
              <div className="section-title">
                <Tv size={20} />
                <h2>Trending This Week</h2>
              </div>
            </div>
            {trendingLoading ? (
              <LoadingSkeleton type="row" count={6} />
            ) : trendingItems.length > 0 ? (
              <ContentRow items={trendingItems} />
            ) : (
              <p className="empty-message">No trending content available.</p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

export default ForYou;
