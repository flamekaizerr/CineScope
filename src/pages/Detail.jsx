import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import {
  Star, Clock, Calendar, Play, ChevronDown, ChevronUp, ExternalLink,
} from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useUserData } from '../context/UserDataContext';
import * as tmdb from '../services/tmdb';
import { formatDate, formatRuntime, formatRating, formatNumber, getYearFromDate, truncateText } from '../utils/helpers';
import RatingBadge from '../components/common/RatingBadge';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import ContentRow from '../components/common/ContentRow';
import GenrePill from '../components/common/GenrePill';
import WatchlistButton from '../components/features/WatchlistButton';
import WhereToWatch from '../components/features/WhereToWatch';
import CastList from '../components/features/CastList';
import TrailerModal from '../components/features/TrailerModal';
import { FALLBACK_MOVIES, FALLBACK_TV } from '../utils/fallbackData';

function Detail() {
  const { mediaType, id } = useParams();
  const location = useLocation();
  const { updateRating, getItem } = useUserData();

  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [showTrailer, setShowTrailer] = useState(false);
  const [expandedReview, setExpandedReview] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [showAllCast, setShowAllCast] = useState(false);

  const type = mediaType || (location.pathname.startsWith('/movie/') ? 'movie' : 'tv');

  const {
    data: details,
    loading: detailsLoading,
  } = useApi(() => tmdb.getDetails(type, id), [type, id]);

  const {
    data: credits,
    loading: creditsLoading,
  } = useApi(() => tmdb.getCredits(type, id), [type, id]);

  const {
    data: videos,
  } = useApi(() => tmdb.getVideos(type, id), [type, id]);

  const {
    data: reviews,
    loading: reviewsLoading,
  } = useApi(() => tmdb.getReviews(type, id), [type, id]);

  const {
    data: recommendations,
    loading: recommendationsLoading,
  } = useApi(() => tmdb.getRecommendations(type, id), [type, id]);

  const {
    data: similar,
    loading: similarLoading,
  } = useApi(() => tmdb.getSimilar(type, id), [type, id]);

  const {
    data: watchProviders,
    loading: providersLoading,
  } = useApi(() => tmdb.getWatchProviders(type, id), [type, id]);

  const storedDetails = useMemo(() => {
    if (location.state?.fallback) {
      const fallback = location.state.fallback;
      return {
        ...fallback,
        title: fallback.title || fallback.name,
        name: fallback.name || fallback.title,
        release_date: fallback.release_date || fallback.first_air_date,
        first_air_date: fallback.first_air_date || fallback.release_date,
        genres: fallback.genres || [],
      };
    }
    const fallbackList = type === 'movie' ? FALLBACK_MOVIES : FALLBACK_TV;
    const fallbackItem = fallbackList.find((item) => String(item.id) === String(id));
    if (fallbackItem) {
      return {
        ...fallbackItem,
        title: fallbackItem.title || fallbackItem.name,
        name: fallbackItem.name || fallbackItem.title,
        release_date: fallbackItem.release_date || fallbackItem.first_air_date,
        first_air_date: fallbackItem.first_air_date || fallbackItem.release_date,
        genres: fallbackItem.genres || [],
      };
    }

    try {
      const raw = sessionStorage.getItem(`cinescope_media_${type}_${id}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return {
        ...parsed,
        title: parsed.title || parsed.name,
        name: parsed.name || parsed.title,
        release_date: parsed.release_date || parsed.first_air_date,
        first_air_date: parsed.first_air_date || parsed.release_date,
        genres: parsed.genres || [],
      };
    } catch {
      return null;
    }
  }, [id, type, location.state]);

  const detailsForPage = details || storedDetails;

  const {
    data: seasonData,
    loading: seasonLoading,
  } = useApi(
    () => (type === 'tv' && detailsForPage ? tmdb.getSeasonDetails(id, selectedSeason) : Promise.resolve(null)),
    [id, selectedSeason, type, detailsForPage]
  );

  // Load user's existing rating
  useEffect(() => {
    if (detailsForPage) {
      const savedItem = getItem(Number(id), type) || getItem(id, type);
      setUserRating(savedItem?.rating || 0);
    }
  }, [detailsForPage, id, type, getItem]);

  const trailer = useMemo(() => {
    const videoList = videos?.results || [];
    return (
      videoList.find((v) => v.type === 'Trailer' && v.site === 'YouTube') ||
      videoList.find((v) => v.site === 'YouTube') ||
      null
    );
  }, [videos]);

  const handleRating = useCallback((rating) => {
    setUserRating(rating);
    updateRating(Number(id), type, rating);
  }, [id, type, updateRating]);

  const cast = credits?.cast || [];
  const crew = credits?.crew || [];
  const director = crew.find((c) => c.job === 'Director');
  const reviewList = reviews?.results || [];
  const recommendationList = recommendations?.results || [];
  const similarList = similar?.results || [];
  const episodes = seasonData?.episodes || [];
  const seasons = detailsForPage?.seasons?.filter((s) => s.season_number > 0) || [];

  if (detailsLoading && !storedDetails) {
    return (
      <div className="page detail-page">
        <LoadingSkeleton type="detail" />
      </div>
    );
  }

  if (!detailsForPage) {
    return (
      <div className="page detail-page">
        <div className="error-state">
          <h2>Failed to load details</h2>
          <p>We couldn't find what you're looking for. It may have been removed or the link is incorrect.</p>
          <Link to="/" className="back-link">Go Home</Link>
        </div>
      </div>
    );
  }

  const title = detailsForPage.title || detailsForPage.name;
  const releaseDate = detailsForPage.release_date || detailsForPage.first_air_date;
  const year = getYearFromDate(releaseDate);
  const runtime = detailsForPage.runtime || detailsForPage.episode_run_time?.[0];
  const backdropUrl = detailsForPage.backdrop_path
    ? `https://image.tmdb.org/t/p/original${detailsForPage.backdrop_path}`
    : null;
  const posterUrl = detailsForPage.poster_path
    ? (String(detailsForPage.poster_path).startsWith('http')
      ? detailsForPage.poster_path
      : `https://image.tmdb.org/t/p/w500${detailsForPage.poster_path}`)
    : null;
  const trailerSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${title} ${year || ''} official trailer`)}`;

  return (
    <div className="page detail-page">
      {/* Backdrop Header */}
      <div
        className="detail-backdrop"
        style={backdropUrl ? { backgroundImage: `url(${backdropUrl})` } : {}}
      >
        <div className="detail-backdrop-overlay">
          <div className="detail-header-content">
            {/* Poster */}
            <div className="detail-poster">
              {posterUrl ? (
                <img src={posterUrl} alt={title} className="detail-poster-img" />
              ) : (
                <div className="detail-poster-placeholder">
                  <Play size={32} />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="detail-info">
              <h1 className="detail-title">
                {title} {year && <span className="detail-year">({year})</span>}
              </h1>

              <div className="detail-meta">
                {releaseDate && (
                  <span className="detail-meta-item">
                    <Calendar size={14} /> {formatDate(releaseDate)}
                  </span>
                )}
                {runtime && (
                  <span className="detail-meta-item">
                    <Clock size={14} /> {formatRuntime(runtime)}
                  </span>
                )}
                {detailsForPage.status && (
                  <span className="detail-meta-item detail-status">{detailsForPage.status}</span>
                )}
              </div>

              {/* Genres */}
              <div className="detail-genres">
                {detailsForPage.genres?.map((genre) => (
                  <GenrePill key={genre.id} genre={genre} />
                ))}
              </div>

              {/* Rating Badge */}
              <div className="detail-rating-row">
                <RatingBadge rating={detailsForPage.vote_average} />
                <span className="detail-vote-count">
                  {formatNumber(detailsForPage.vote_count)} votes
                </span>
              </div>

              {/* User Rating */}
              <div className="detail-user-rating">
                <span className="detail-user-rating-label">Your Rating:</span>
                <div className="star-rating">
                  {Array.from({ length: 10 }).map((_, i) => {
                    const starValue = i + 1;
                    return (
                      <button
                        key={starValue}
                        className={`star-btn ${starValue <= (hoverRating || userRating) ? 'star-filled' : ''}`}
                        onClick={() => handleRating(starValue)}
                        onMouseEnter={() => setHoverRating(starValue)}
                        onMouseLeave={() => setHoverRating(0)}
                        aria-label={`Rate ${starValue} out of 10`}
                      >
                        <Star size={18} fill={starValue <= (hoverRating || userRating) ? 'currentColor' : 'none'} />
                      </button>
                    );
                  })}
                  {userRating > 0 && (
                    <span className="star-rating-value">{userRating}/10</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="detail-actions">
                <WatchlistButton item={detailsForPage} mediaType={type} />
                {trailer && (
                  <button className="btn btn-trailer" onClick={() => setShowTrailer(true)}>
                    <Play size={16} /> Watch Trailer
                  </button>
                )}
                {!trailer && (
                  <a className="btn btn-trailer" href={trailerSearchUrl} target="_blank" rel="noreferrer">
                    <ExternalLink size={16} /> Find Trailer
                  </a>
                )}
              </div>

              {/* Director */}
              {director && (
                <div className="detail-director">
                  <span className="detail-director-label">Directed by</span>
                  <span className="detail-director-name">{director.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="page-content">
        {/* Overview */}
        {detailsForPage.overview && (
          <section className="section">
            <h2 className="section-title">Overview</h2>
            <p className="detail-overview">{detailsForPage.overview}</p>
          </section>
        )}

        {/* Where to Watch */}
        <section className="section">
          <h2 className="section-title">Where to Watch</h2>
          {providersLoading ? (
            <LoadingSkeleton type="providers" />
          ) : (
            <WhereToWatch providers={watchProviders} />
          )}
        </section>

        {/* Cast */}
        <section className="section">
          <h2 className="section-title">Cast</h2>
          {creditsLoading ? (
            <LoadingSkeleton type="cast" count={8} />
          ) : cast.length > 0 ? (
            <CastList cast={showAllCast ? cast : cast.slice(0, 12)} />
          ) : (
            <p className="empty-message">No cast information available.</p>
          )}
          {cast.length > 12 && (
            <button
              className="btn btn-text"
              onClick={() => setShowAllCast(!showAllCast)}
            >
              {showAllCast ? (
                <>Show Less <ChevronUp size={14} /></>
              ) : (
                <>Show All ({cast.length}) <ChevronDown size={14} /></>
              )}
            </button>
          )}
        </section>

        {/* TV: Season Selector & Episodes */}
        {type === 'tv' && seasons.length > 0 && (
          <section className="section">
            <div className="section-header">
              <h2 className="section-title">Episodes</h2>
              <div className="season-selector">
                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(Number(e.target.value))}
                  className="season-select"
                >
                  {seasons.map((season) => (
                    <option key={season.season_number} value={season.season_number}>
                      Season {season.season_number} ({season.episode_count} episodes)
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {seasonLoading ? (
              <LoadingSkeleton type="episodes" count={6} />
            ) : episodes.length > 0 ? (
              <div className="episodes-list">
                {episodes.map((episode) => (
                  <div key={episode.id} className="episode-card">
                    <div className="episode-still">
                      {episode.still_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w300${episode.still_path}`}
                          alt={episode.name}
                        />
                      ) : (
                        <div className="episode-still-placeholder">
                          <Play size={20} />
                        </div>
                      )}
                    </div>
                    <div className="episode-info">
                      <div className="episode-number">E{episode.episode_number}</div>
                      <h4 className="episode-title">{episode.name}</h4>
                      {episode.air_date && (
                        <span className="episode-date">{formatDate(episode.air_date)}</span>
                      )}
                      {episode.vote_average > 0 && (
                        <span className="episode-rating">
                          <Star size={12} /> {formatRating(episode.vote_average)}
                        </span>
                      )}
                      {episode.overview && (
                        <p className="episode-overview">{truncateText(episode.overview, 150)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-message">No episode information available for this season.</p>
            )}
          </section>
        )}

        {/* Reviews */}
        <section className="section">
          <h2 className="section-title">Reviews</h2>
          {reviewsLoading ? (
            <LoadingSkeleton type="reviews" count={3} />
          ) : reviewList.length > 0 ? (
            <div className="reviews-list">
              {reviewList.slice(0, 5).map((review) => (
                <div key={review.id} className="review-card">
                  <div className="review-header">
                    <div className="review-author">
                      {review.author_details?.avatar_path ? (
                        <img
                          src={
                            review.author_details.avatar_path.startsWith('/http')
                              ? review.author_details.avatar_path.slice(1)
                              : `https://image.tmdb.org/t/p/w45${review.author_details.avatar_path}`
                          }
                          alt={review.author}
                          className="review-avatar"
                        />
                      ) : (
                        <div className="review-avatar-placeholder">
                          {review.author?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                      <span className="review-author-name">{review.author}</span>
                    </div>
                    {review.author_details?.rating && (
                      <span className="review-rating">
                        <Star size={12} /> {review.author_details.rating}/10
                      </span>
                    )}
                  </div>
                  <p className="review-content">
                    {expandedReview === review.id
                      ? review.content
                      : truncateText(review.content, 300)}
                  </p>
                  {review.content.length > 300 && (
                    <button
                      className="btn btn-text"
                      onClick={() =>
                        setExpandedReview(expandedReview === review.id ? null : review.id)
                      }
                    >
                      {expandedReview === review.id ? 'Show Less' : 'Read More'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-message">No reviews yet. Be the first to review!</p>
          )}
        </section>

        {/* Recommendations */}
        {recommendationList.length > 0 && (
          <section className="section">
            <h2 className="section-title">Recommendations</h2>
            {recommendationsLoading ? (
              <LoadingSkeleton type="row" count={6} />
            ) : (
              <ContentRow items={recommendationList} />
            )}
          </section>
        )}

        {/* Similar */}
        {similarList.length > 0 && (
          <section className="section">
            <h2 className="section-title">Similar Titles</h2>
            {similarLoading ? (
              <LoadingSkeleton type="row" count={6} />
            ) : (
              <ContentRow items={similarList} />
            )}
          </section>
        )}
      </div>

      {/* Trailer Modal */}
      {showTrailer && trailer && (
        <TrailerModal
          videoKey={trailer.key}
          title={trailer.name}
          onClose={() => setShowTrailer(false)}
        />
      )}
    </div>
  );
}

export default Detail;
