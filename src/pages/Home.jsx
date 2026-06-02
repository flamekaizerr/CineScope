import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, TrendingUp, Film, Tv, Sparkles, Users, Clock, Flame } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import * as tmdb from '../services/tmdb';
import * as jikan from '../services/jikan';
import * as trakt from '../services/trakt';
import { MEDIA_TYPES, TIME_WINDOWS } from '../utils/constants';
import HeroCarousel from '../components/common/HeroCarousel';
import ContentRow from '../components/common/ContentRow';
import MediaCard from '../components/common/MediaCard';
import LoadingSkeleton from '../components/common/LoadingSkeleton';

function Home() {
  const [trendingWindow, setTrendingWindow] = useState('day');

  const {
    data: heroMovies,
    loading: heroLoading,
    error: heroError,
  } = useApi(() => tmdb.getTrending('movie', 'day'), []);

  const {
    data: trendingAll,
    loading: trendingLoading,
    error: trendingError,
  } = useApi(() => tmdb.getTrending('all', trendingWindow), [trendingWindow]);

  const {
    data: trendingWeek,
    loading: trendingWeekLoading,
    error: trendingWeekError,
  } = useApi(() => tmdb.getTrending('all', 'week'), []);

  const {
    data: nowPlaying,
    loading: nowPlayingLoading,
    error: nowPlayingError,
  } = useApi(() => tmdb.getNowPlaying(), []);

  const {
    data: flopping,
    loading: floppingLoading,
    error: floppingError,
  } = useApi(() => tmdb.getFlopping(), []);

  const {
    data: streaming,
    loading: streamingLoading,
    error: streamingError,
  } = useApi(() => tmdb.getNewOnStreaming(), []);

  const {
    data: seasonAnime,
    loading: animeLoading,
    error: animeError,
  } = useApi(() => jikan.getSeasonNow(), []);

  const {
    data: communityTrending,
    loading: communityLoading,
    error: communityError,
  } = useApi(() => trakt.getTrending('movies'), []);

  const heroItems = heroMovies?.results?.slice(0, 8) || [];
  const trendingItems = trendingAll?.results || [];
  const trendingWeekItems = trendingWeek?.results || [];
  const nowPlayingItems = nowPlaying?.results || [];
  const floppingItems = flopping?.results || [];
  const streamingItems = streaming?.results || [];
  const animeItems = seasonAnime?.data || [];
  const communityItems = communityTrending || [];

  const renderSectionHeader = (icon, title, linkTo, linkText = 'See All') => (
    <div className="section-header">
      <div className="section-title">
        {icon}
        <h2>{title}</h2>
      </div>
      {linkTo && (
        <Link to={linkTo} className="section-link">
          {linkText} <ChevronRight size={16} />
        </Link>
      )}
    </div>
  );

  const renderTimeToggle = () => (
    <div className="tabs">
      {[
        { key: 'day', label: 'Today' },
        { key: 'week', label: 'This Week' },
      ].map((tab) => (
        <button
          key={tab.key}
          className={`tab ${trendingWindow === tab.key ? 'tab-active' : ''}`}
          onClick={() => setTrendingWindow(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  const renderError = (message) => (
    <div className="section-error">
      <p>Failed to load: {message}</p>
    </div>
  );

  return (
    <div className="page home-page">
      {/* Hero Carousel */}
      <section className="hero-section">
        {heroLoading ? (
          <LoadingSkeleton type="hero" />
        ) : heroError ? (
          renderError('hero content')
        ) : heroItems.length > 0 ? (
          <HeroCarousel items={heroItems} />
        ) : null}
      </section>

      <div className="page-content">
        {/* Trending Section with Toggle */}
        <section className="section">
          <div className="section-header-row">
            {renderSectionHeader(
              <TrendingUp size={20} />,
              'Trending',
              '/movies'
            )}
            {renderTimeToggle()}
          </div>
          {trendingLoading ? (
            <LoadingSkeleton type="row" count={6} />
          ) : trendingError ? (
            renderError('trending content')
          ) : trendingItems.length > 0 ? (
            <ContentRow items={trendingItems} />
          ) : (
            <p className="empty-message">No trending content available right now.</p>
          )}
        </section>

        {/* Trending This Week */}
        <section className="section">
          {renderSectionHeader(
            <Flame size={20} />,
            'Trending This Week',
            '/movies'
          )}
          {trendingWeekLoading ? (
            <LoadingSkeleton type="row" count={6} />
          ) : trendingWeekError ? (
            renderError('weekly trends')
          ) : trendingWeekItems.length > 0 ? (
            <ContentRow items={trendingWeekItems} />
          ) : (
            <p className="empty-message">No weekly trends available.</p>
          )}
        </section>

        {/* Now in Cinemas */}
        <section className="section">
          {renderSectionHeader(
            <Film size={20} />,
            'Now in Cinemas',
            '/movies?tab=now_playing'
          )}
          {nowPlayingLoading ? (
            <LoadingSkeleton type="row" count={6} />
          ) : nowPlayingError ? (
            renderError('now playing')
          ) : nowPlayingItems.length > 0 ? (
            <ContentRow items={nowPlayingItems} />
          ) : (
            <p className="empty-message">No movies currently in cinemas.</p>
          )}
        </section>

        {/* What's Flopping */}
        <section className="section">
          {renderSectionHeader(
            <TrendingUp size={20} className="icon-flipped" />,
            "What's Flopping",
            null
          )}
          {floppingLoading ? (
            <LoadingSkeleton type="row" count={6} />
          ) : floppingError ? (
            renderError('flopping content')
          ) : floppingItems.length > 0 ? (
            <ContentRow items={floppingItems} />
          ) : (
            <p className="empty-message">Nothing flopping at the moment.</p>
          )}
        </section>

        {/* New on Streaming */}
        <section className="section">
          {renderSectionHeader(
            <Tv size={20} />,
            'New on Streaming',
            '/tv'
          )}
          {streamingLoading ? (
            <LoadingSkeleton type="row" count={6} />
          ) : streamingError ? (
            renderError('streaming content')
          ) : streamingItems.length > 0 ? (
            <ContentRow items={streamingItems} />
          ) : (
            <p className="empty-message">No new streaming content available.</p>
          )}
        </section>

        {/* Top Anime This Season */}
        <section className="section">
          {renderSectionHeader(
            <Sparkles size={20} />,
            'Top Anime This Season',
            '/anime'
          )}
          {animeLoading ? (
            <LoadingSkeleton type="row" count={6} />
          ) : animeError ? (
            renderError('anime content')
          ) : animeItems.length > 0 ? (
            <ContentRow
              items={animeItems.map((anime) => ({
                id: anime.mal_id,
                title: anime.title_english || anime.title,
                poster_path: anime.images?.jpg?.large_image_url,
                vote_average: anime.score,
                media_type: 'anime',
                release_date: anime.aired?.from,
              }))}
            />
          ) : (
            <p className="empty-message">No seasonal anime available.</p>
          )}
        </section>

        {/* Community Hot Right Now */}
        <section className="section">
          {renderSectionHeader(
            <Users size={20} />,
            'Community Hot Right Now',
            '/buzz'
          )}
          {communityLoading ? (
            <LoadingSkeleton type="row" count={6} />
          ) : communityError ? (
            renderError('community content')
          ) : communityItems.length > 0 ? (
            <ContentRow
              items={communityItems.map((item) => ({
                id: item.movie?.ids?.tmdb,
                title: item.movie?.title,
                poster_path: null,
                vote_average: item.movie?.rating,
                media_type: 'movie',
                release_date: item.movie?.year?.toString(),
                watchers: item.watchers,
              }))}
            />
          ) : (
            <p className="empty-message">No community trends available.</p>
          )}
        </section>
      </div>
    </div>
  );
}

export default Home;
