import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, ChevronRight, Clapperboard, Flame, Search, Sparkles, Star, Tv, Users } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import * as tmdb from '../services/tmdb';
import * as jikan from '../services/jikan';
import * as trakt from '../services/trakt';
import ContentRow from '../components/common/ContentRow';
import { MEDIA_TYPES, BACKDROP_SIZES, POSTER_SIZES, TMDB_IMAGE_BASE } from '../utils/constants';

const DISCOVERY_LINKS = [
  { label: 'Movies', to: '/movies' },
  { label: 'TV Shows', to: '/tv' },
  { label: 'Anime', to: '/anime' },
  { label: 'Animation', to: '/animation' },
  { label: 'For You', to: '/for-you' },
  { label: 'Internet Buzz', to: '/buzz' },
];

function getTitle(item) {
  return item?.title || item?.name || 'Untitled';
}

function getMediaType(item) {
  return item?.media_type || item?.type || (item?.first_air_date ? MEDIA_TYPES.TV : MEDIA_TYPES.MOVIE);
}

function getMediaLabel(item) {
  const type = getMediaType(item);
  if (type === MEDIA_TYPES.TV) return 'TV';
  if (type === MEDIA_TYPES.ANIME) return 'Anime';
  return 'Movie';
}

function getImageUrl(path, size) {
  if (!path) return '';
  if (String(path).startsWith('http') || String(path).startsWith('data:')) return path;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

function normalizeAnime(anime) {
  return {
    id: anime.mal_id || anime.id,
    title: anime.title_english || anime.title,
    poster_path: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || anime.poster_path,
    vote_average: anime.score || anime.vote_average,
    media_type: MEDIA_TYPES.ANIME,
    release_date: anime.aired?.from || anime.release_date,
    overview: anime.synopsis || anime.overview,
  };
}

function uniqueById(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${getMediaType(item)}-${item?.id || getTitle(item)}`;
    if (!item || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function Home() {
  const navigate = useNavigate();
  const [trendingWindow, setTrendingWindow] = useState('day');
  const [searchQuery, setSearchQuery] = useState('');
  const [showStickySearch, setShowStickySearch] = useState(false);
  const searchFormRef = useRef(null);

  const { data: trendingAll, loading: trendingAllLoading } = useApi(
    () => tmdb.getTrending('all', trendingWindow),
    [trendingWindow]
  );

  const { data: trendingWeek } = useApi(
    () => tmdb.getTrending('all', 'week'),
    []
  );

  const { data: nowPlaying, loading: nowPlayingLoading } = useApi(
    () => tmdb.getNowPlaying(),
    []
  );

  const { data: streaming, loading: streamingLoading } = useApi(
    () => tmdb.getNewOnStreaming(),
    []
  );

  const { data: animation, loading: animationLoading } = useApi(
    () => tmdb.getAnimationMovies({ timeWindow: 'year' }),
    []
  );

  const { data: upcoming, loading: upcomingLoading } = useApi(
    () => tmdb.getUpcoming(),
    []
  );

  const { data: seasonAnime, loading: seasonAnimeLoading } = useApi(
    () => jikan.getSeasonNow(),
    []
  );

  const { data: communityTrending, loading: communityLoading } = useApi(
    () => trakt.getTrending('movies'),
    []
  );

  const trendingItems = trendingAll?.results || [];
  const weekItems = trendingWeek?.results || [];
  const movieItems = nowPlaying?.results || [];
  const streamingItems = streaming?.results || [];
  const animationItems = animation?.results || [];
  const upcomingItems = upcoming?.results || [];
  const animeItems = seasonAnime?.data?.length ? seasonAnime.data.map(normalizeAnime) : [];
  const communityItems = communityTrending?.length
    ? communityTrending
      .map((item) => ({
        id: item.movie?.ids?.tmdb,
        title: item.movie?.title,
        poster_path: null,
        vote_average: item.movie?.rating || null,
        media_type: MEDIA_TYPES.MOVIE,
        release_date: item.movie?.year?.toString(),
        watchers: item.watchers,
      }))
      .filter((item) => item.id)
    : weekItems.slice(0, 12);

  const hotItems = useMemo(
    () => uniqueById([...trendingItems, ...animeItems, ...weekItems]).slice(0, 10),
    [trendingItems, animeItems, weekItems]
  );

  const heroItem = hotItems[0];
  const heroBackdrop =
    getImageUrl(heroItem?.backdrop_path, BACKDROP_SIZES.LARGE) ||
    getImageUrl(heroItem?.poster_path || heroItem?.poster, POSTER_SIZES.LARGE);

  const stats = [
    { label: 'Movies', value: `${movieItems.length}+` },
    { label: 'TV Picks', value: `${weekItems.filter((item) => getMediaType(item) === MEDIA_TYPES.TV).length}+` },
    { label: 'Anime', value: `${animeItems.length}+` },
    { label: 'Animation', value: `${animationItems.length}+` },
  ];

  const handleSearch = (event) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 760px)');
    if (!mq.matches) return;

    const el = searchFormRef.current;
    if (!el) return;

    const navbarHeight = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--navbar-height') || '72',
      10
    );

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickySearch(!entry.isIntersecting);
      },
      {
        threshold: 0,
        rootMargin: `-${navbarHeight}px 0px 0px 0px`,
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const renderSectionHeader = (icon, title, to, label = 'See all') => (
    <div className="section-header">
      <div className="section-title">
        {icon}
        <h2>{title}</h2>
      </div>
      {to && (
        <Link to={to} className="section-link">
          {label}
          <ChevronRight size={16} aria-hidden="true" />
        </Link>
      )}
    </div>
  );

  return (
    <div className="page home-page streaming-home">
      <section className="stream-home-hero" style={heroBackdrop ? { '--hero-backdrop': `url(${heroBackdrop})` } : undefined}>
        <div className="stream-hero-copy">
          <span className="stream-kicker">Live entertainment pulse</span>
          <h1>Find what everyone is watching right now.</h1>
          <p>
            Movies, shows, anime, ratings, buzz, watch options, and recommendations in one fast place.
          </p>

          <form className="stream-hero-search" onSubmit={handleSearch} role="search" ref={searchFormRef}>
            <Search size={20} aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search any title"
              aria-label="Search movies, shows, and anime"
            />
            <button type="submit">Search</button>
          </form>

          <div className="stream-quick-links" aria-label="Start browsing">
            {DISCOVERY_LINKS.map((link) => (
              <Link key={link.to} to={link.to}>{link.label}</Link>
            ))}
          </div>

          <div className="stream-stat-grid" aria-label="Catalog snapshot">
            {stats.map((stat) => (
              <div className="stream-stat" key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        <aside className="hot-panel" aria-label="Hot right now">
          <div className="hot-panel-header">
            <div>
              <span className="stream-kicker">Hot right now</span>
              <h2>Top 10</h2>
            </div>
            <div className="tabs hot-tabs">
              {[
                { key: 'day', label: 'Today' },
                { key: 'week', label: 'Week' },
                { key: 'month', label: 'Month' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  className={`tab hot-tab window-chip ${trendingWindow === tab.key ? 'tab-active' : ''}`}
                  onClick={() => setTrendingWindow(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="hot-list">
            {hotItems.map((item, index) => {
              const type = getMediaType(item);
              const to = `/${type}/${item.id}`;
              const poster = getImageUrl(item.poster_path || item.poster, POSTER_SIZES.SMALL);
              return (
                <Link
                  key={`${type}-${item.id || index}`}
                  to={to}
                  className="hot-item"
                  state={{ fallback: { ...item, media_type: type, type } }}
                >
                  <span className="hot-rank">{index + 1}</span>
                  <div className="hot-poster">
                    {poster ? <img src={poster} alt="" loading="lazy" /> : <Clapperboard size={20} aria-hidden="true" />}
                  </div>
                  <div className="hot-meta">
                    <strong>{getTitle(item)}</strong>
                    <span>{getMediaLabel(item)}</span>
                  </div>
                  {item.vote_average ? (
                    <span className="hot-rating">
                      <Star size={13} aria-hidden="true" />
                      {Number(item.vote_average).toFixed(1)}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </aside>
      </section>

      {showStickySearch && (
        <div className="sticky-search-clone" aria-label="Sticky search bar">
          <form className="stream-hero-search" onSubmit={handleSearch} role="search">
            <Search size={20} aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search any title"
              aria-label="Search movies, shows, and anime"
            />
            <button type="submit">Search</button>
          </form>
          <div className="stream-quick-links sticky-quick-links" aria-label="Start browsing">
            {DISCOVERY_LINKS.map((link) => (
              <Link key={link.to} to={link.to}>{link.label}</Link>
            ))}
          </div>
        </div>
      )}

      <div className="page-content stream-content">
        <section className="section">
          {renderSectionHeader(<Flame size={20} aria-hidden="true" />, 'Trending Today', '/trending')}
          <ContentRow items={trendingItems} isLoading={trendingAllLoading} />
        </section>

        <section className="section">
          {renderSectionHeader(<Users size={20} aria-hidden="true" />, 'Internet Buzz This Week', '/buzz')}
          <ContentRow items={communityItems} isLoading={communityLoading} />
        </section>

        <section className="section">
          {renderSectionHeader(<Clapperboard size={20} aria-hidden="true" />, 'Animation Studio Picks', '/animation')}
          <ContentRow items={animationItems} mediaType={MEDIA_TYPES.MOVIE} isLoading={animationLoading} />
        </section>

        <section className="section">
          {renderSectionHeader(<Clapperboard size={20} aria-hidden="true" />, 'Now in Cinemas', '/movies')}
          <ContentRow items={movieItems} mediaType={MEDIA_TYPES.MOVIE} isLoading={nowPlayingLoading} />
        </section>

        <section className="section">
          {renderSectionHeader(<Tv size={20} aria-hidden="true" />, 'Fresh on Streaming', '/movies')}
          <ContentRow items={streamingItems} mediaType={MEDIA_TYPES.MOVIE} isLoading={streamingLoading} />
        </section>

        <section className="section">
          {renderSectionHeader(<Sparkles size={20} aria-hidden="true" />, 'Anime Heat', '/anime')}
          <ContentRow items={animeItems} mediaType={MEDIA_TYPES.ANIME} isLoading={seasonAnimeLoading} />
        </section>

        <section className="section">
          {renderSectionHeader(<CalendarDays size={20} aria-hidden="true" />, 'Coming Soon', '/movies')}
          <ContentRow items={upcomingItems} mediaType={MEDIA_TYPES.MOVIE} isLoading={upcomingLoading} />
        </section>
      </div>
    </div>
  );
}

export default Home;
