import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import {
  Star, Play, Users, Heart, Trophy, TrendingUp, Tv,
  Calendar, Clock, BookOpen, ChevronDown, ChevronUp, ExternalLink, X
} from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useUserData } from '../context/UserDataContext';
import * as jikan from '../services/jikan';
import { formatNumber, truncateText } from '../utils/helpers';
import RatingBadge from '../components/common/RatingBadge';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import ContentRow from '../components/common/ContentRow';
import GenrePill from '../components/common/GenrePill';
import WatchlistButton from '../components/features/WatchlistButton';

function AnimeDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { updateRating, getItem } = useUserData();

  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [showFullSynopsis, setShowFullSynopsis] = useState(false);
  const [showAllCharacters, setShowAllCharacters] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [activePanel, setActivePanel] = useState('overview');

  const {
    data: anime,
    loading: animeLoading,
    error: animeError,
  } = useApi(() => jikan.getAnimeById(id), [id]);

  const {
    data: characters,
    loading: charactersLoading,
  } = useApi(() => jikan.getAnimeCharacters(id), [id]);

  const {
    data: recommendations,
    loading: recommendationsLoading,
  } = useApi(() => jikan.getAnimeRecommendations(id), [id]);

  const animeData = anime;
  const characterList = Array.isArray(characters) ? characters : [];
  const recommendationList = Array.isArray(recommendations) ? recommendations : [];

  // Load user's existing rating
  useEffect(() => {
    if (animeData) {
      const savedItem = getItem(animeData.mal_id, 'anime');
      setUserRating(savedItem?.rating || 0);
    }
  }, [animeData, getItem]);

  const handleRating = (rating) => {
    setUserRating(rating);
    updateRating(animeData.mal_id, 'anime', rating);
  };

  const trailerUrl = animeData?.trailer?.youtube_id
    ? `https://www.youtube.com/embed/${animeData.trailer.youtube_id}`
    : null;

  if (animeLoading) {
    return (
      <div className="page detail-page">
        <LoadingSkeleton type="detail" />
      </div>
    );
  }

  if (animeError || !animeData) {
    return (
      <div className="page detail-page">
        <div className="error-state">
          <h2>Failed to load anime details</h2>
          <p>We couldn't find the anime you're looking for.</p>
          <Link to="/anime" className="back-link">Browse Anime</Link>
        </div>
      </div>
    );
  }

  const imageUrl = animeData.images?.jpg?.large_image_url || animeData.images?.jpg?.image_url;
  const title = animeData.title_english || animeData.title;
  const japaneseTitle = animeData.title_japanese;
  const synopsis = animeData.synopsis || '';
  const genres = animeData.genres || [];
  const themes = animeData.themes || [];
  const studios = animeData.studios || [];
  const score = animeData.score;
  const scoredBy = animeData.scored_by;
  const episodes = animeData.episodes;
  const status = animeData.status;
  const duration = animeData.duration;
  const aired = animeData.aired?.string;
  const rating = animeData.rating;
  const source = animeData.source;
  const rank = animeData.rank;
  const popularity = animeData.popularity;
  const members = animeData.members;
  const favorites = animeData.favorites;
  const trailerSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${title} anime official trailer`)}`;

  const displayCharacters = showAllCharacters ? characterList : characterList.slice(0, 12);
  const handleClose = () => {
    if (location.key && location.key !== 'default') {
      navigate(-1);
      return;
    }
    navigate('/anime');
  };

  return (
    <div className="page detail-page anime-detail-page">
      <button className="detail-close-btn" type="button" onClick={handleClose} aria-label="Close title">
        <X size={20} aria-hidden="true" />
      </button>
      {/* Header */}
      <div className="anime-detail-header">
        <div className="anime-detail-header-content">
          {/* Image */}
          <div className="detail-poster">
            {imageUrl ? (
              <img src={imageUrl} alt={title} className="detail-poster-img" />
            ) : (
              <div className="detail-poster-placeholder">
                <Play size={32} />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="detail-info">
            <h1 className="detail-title">{title}</h1>
            {japaneseTitle && (
              <p className="anime-japanese-title">{japaneseTitle}</p>
            )}

            <div className="detail-meta">
              {episodes && (
                <span className="detail-meta-item">
                  <Tv size={14} /> {episodes} Episodes
                </span>
              )}
              {status && (
                <span className="detail-meta-item detail-status">{status}</span>
              )}
              {duration && (
                <span className="detail-meta-item">
                  <Clock size={14} /> {duration}
                </span>
              )}
              {aired && (
                <span className="detail-meta-item">
                  <Calendar size={14} /> {aired}
                </span>
              )}
              {source && (
                <span className="detail-meta-item">
                  <BookOpen size={14} /> {source}
                </span>
              )}
              {rating && (
                <span className="detail-meta-item">{rating}</span>
              )}
            </div>

            {/* Genres & Themes */}
            <div className="detail-genres">
              {genres.map((g) => (
                <GenrePill key={g.mal_id} genre={{ id: g.mal_id, name: g.name }} />
              ))}
              {themes.map((t) => (
                <GenrePill key={`theme-${t.mal_id}`} genre={{ id: t.mal_id, name: t.name }} variant="theme" />
              ))}
            </div>

            {/* Score */}
            <div className="detail-rating-row">
              <RatingBadge rating={score} />
              {scoredBy && (
                <span className="detail-vote-count">
                  {formatNumber(scoredBy)} ratings
                </span>
              )}
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

            {/* Actions */}
            <div className="detail-actions">
              <WatchlistButton
                item={{
                  id: animeData.mal_id,
                  title,
                  poster_path: imageUrl,
                  vote_average: score,
                  media_type: 'anime',
                }}
                mediaType="anime"
              />
              {trailerUrl && (
                <button className="btn btn-trailer" onClick={() => { setActivePanel('watch'); setShowTrailer(true); }}>
                  <Play size={16} /> Watch Trailer
                </button>
              )}
              {!trailerUrl && (
                <a className="btn btn-trailer" href={trailerSearchUrl} target="_blank" rel="noreferrer">
                  <ExternalLink size={16} /> Find Trailer
                </a>
              )}
            </div>

            {/* Studios */}
            {studios.length > 0 && (
              <div className="anime-studios">
                <span className="anime-studios-label">Studios:</span>
                {studios.map((studio, i) => (
                  <span key={studio.mal_id} className="anime-studio-name">
                    {studio.name}{i < studios.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="page-content">
        <div className="detail-tabbar" role="tablist" aria-label={`${title} details`}>
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'characters', label: 'Characters' },
            { key: 'watch', label: 'Watch / Trailer' },
            { key: 'buzz', label: 'Buzz' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activePanel === tab.key}
              className={`detail-tab ${activePanel === tab.key ? 'detail-tab-active' : ''}`}
              onClick={() => setActivePanel(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Statistics */}
        {activePanel === 'overview' && (
        <section className="section detail-panel">
          <h2 className="section-title">Statistics</h2>
          <div className="stat-cards-row">
            {rank && (
              <div className="stat-card">
                <Trophy size={20} />
                <div className="stat-value">#{rank}</div>
                <div className="stat-label">Rank</div>
              </div>
            )}
            {popularity && (
              <div className="stat-card">
                <TrendingUp size={20} />
                <div className="stat-value">#{popularity}</div>
                <div className="stat-label">Popularity</div>
              </div>
            )}
            {members && (
              <div className="stat-card">
                <Users size={20} />
                <div className="stat-value">{formatNumber(members)}</div>
                <div className="stat-label">Members</div>
              </div>
            )}
            {favorites && (
              <div className="stat-card">
                <Heart size={20} />
                <div className="stat-value">{formatNumber(favorites)}</div>
                <div className="stat-label">Favorites</div>
              </div>
            )}
          </div>

          {synopsis && (
          <section className="section detail-nested-section">
            <h2 className="section-title">Synopsis</h2>
            <p className="detail-overview">
              {showFullSynopsis ? synopsis : truncateText(synopsis, 500)}
            </p>
            {synopsis.length > 500 && (
              <button
                className="btn btn-text"
                onClick={() => setShowFullSynopsis(!showFullSynopsis)}
              >
                {showFullSynopsis ? (
                  <>Show Less <ChevronUp size={14} /></>
                ) : (
                  <>Read More <ChevronDown size={14} /></>
                )}
              </button>
            )}
          </section>
          )}
        </section>
        )}

        {activePanel === 'watch' && (
          <section className="section detail-panel">
            <h2 className="section-title">Watch / Trailer</h2>
            <div className="detail-panel-actions">
              {trailerUrl ? (
                <button className="btn btn-trailer" onClick={() => setShowTrailer((open) => !open)}>
                  <Play size={16} /> {showTrailer ? 'Hide Trailer' : 'Watch Trailer'}
                </button>
              ) : (
                <a className="btn btn-trailer" href={trailerSearchUrl} target="_blank" rel="noreferrer">
                  <ExternalLink size={16} /> Find Trailer
                </a>
              )}
              <a className="btn btn-secondary" href={`https://www.google.com/search?q=${encodeURIComponent(`${title} where to watch`)}`} target="_blank" rel="noreferrer">
                <ExternalLink size={16} /> Find Watch Options
              </a>
            </div>
            {showTrailer && trailerUrl && (
              <div className="trailer-embed">
                <iframe
                  src={trailerUrl}
                  title={`${title} Trailer`}
                  className="trailer-iframe"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
            {studios.length > 0 && (
              <div className="anime-studios anime-studios-panel">
                <span className="anime-studios-label">Studios:</span>
                {studios.map((studio, i) => (
                  <span key={studio.mal_id} className="anime-studio-name">
                    {studio.name}{i < studios.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Characters */}
        {activePanel === 'characters' && (
        <section className="section detail-panel">
          <h2 className="section-title">Characters</h2>
          {charactersLoading ? (
            <LoadingSkeleton type="cast" count={8} />
          ) : characterList.length > 0 ? (
            <>
              <div className="characters-grid">
                {displayCharacters.map((charEntry) => {
                  const char = charEntry.character;
                  const voiceActor = charEntry.voice_actors?.find(
                    (va) => va.language === 'Japanese'
                  );
                  return (
                    <div key={char.mal_id} className="character-card">
                      <img
                        src={char.images?.jpg?.image_url || ''}
                        alt={char.name}
                        className="character-img"
                      />
                      <div className="character-info">
                        <span className="character-name">{char.name}</span>
                        <span className="character-role">{charEntry.role}</span>
                        {voiceActor && (
                          <span className="character-va">{voiceActor.person?.name}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {characterList.length > 12 && (
                <button
                  className="btn btn-text"
                  onClick={() => setShowAllCharacters(!showAllCharacters)}
                >
                  {showAllCharacters ? (
                    <>Show Less <ChevronUp size={14} /></>
                  ) : (
                    <>Show All ({characterList.length}) <ChevronDown size={14} /></>
                  )}
                </button>
              )}
            </>
          ) : (
            <p className="empty-message">No character information available.</p>
          )}
        </section>
        )}

        {/* Recommendations */}
        {activePanel === 'buzz' && (
          <section className="section detail-panel">
            <h2 className="section-title">Buzz & Recommendations</h2>
            <div className="stat-cards-row">
              {members && (
                <div className="stat-card">
                  <Users size={20} />
                  <div className="stat-value">{formatNumber(members)}</div>
                  <div className="stat-label">Members</div>
                </div>
              )}
              {favorites && (
                <div className="stat-card">
                  <Heart size={20} />
                  <div className="stat-value">{formatNumber(favorites)}</div>
                  <div className="stat-label">Favorites</div>
                </div>
              )}
            </div>
          {recommendationList.length > 0 && (
          <section className="section detail-nested-section">
            <h2 className="section-title">Recommendations</h2>
            {recommendationsLoading ? (
              <LoadingSkeleton type="row" count={6} />
            ) : (
              <ContentRow
                items={recommendationList.map((rec) => ({
                  id: rec.entry?.mal_id,
                  title: rec.entry?.title,
                  poster_path: rec.entry?.images?.jpg?.large_image_url,
                  media_type: 'anime',
                }))}
              />
            )}
          </section>
          )}
          </section>
        )}
      </div>
    </div>
  );
}

export default AnimeDetail;
