import { useState, useCallback, memo } from 'react';
import { RefreshCw, ChevronDown, ChevronUp, Sparkles, Brain } from 'lucide-react';
import { TMDB_IMAGE_BASE, POSTER_SIZES } from '../../utils/constants';

const FALLBACK_POSTER = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="180" fill="%2323232e"><rect width="120" height="180"/><text x="60" y="90" text-anchor="middle" fill="%23888" font-size="12" font-family="sans-serif">No Image</text></svg>'
);

/**
 * AiRecommendations – AI-powered recommendation cards.
 * Shows title, poster, AI reasoning, match percentage, and a refresh button.
 */
function AiRecommendations({ recommendations, isLoading = false, onRefresh }) {
  const [expandedCards, setExpandedCards] = useState({});

  const toggleExpand = useCallback((id) => {
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <section className="ai-recs" aria-label="AI Recommendations" role="status">
        <div className="ai-recs-header">
          <h3 className="ai-recs-title">
            <Sparkles size={20} aria-hidden="true" />
            AI Recommendations
          </h3>
        </div>
        <div className="ai-rec-loading">
          <div className="ai-thinking" aria-live="polite">
            <Brain size={32} className="ai-thinking-icon" aria-hidden="true" />
            <span className="ai-thinking-text">AI is thinking…</span>
            <div className="ai-thinking-dots">
              <span className="ai-thinking-dot" />
              <span className="ai-thinking-dot" />
              <span className="ai-thinking-dot" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  const validRecs = Array.isArray(recommendations) ? recommendations : [];

  if (validRecs.length === 0) {
    return (
      <section className="ai-recs" aria-label="AI Recommendations">
        <div className="ai-recs-header">
          <h3 className="ai-recs-title">
            <Sparkles size={20} aria-hidden="true" />
            AI Recommendations
          </h3>
          {onRefresh && (
            <button
              className="ai-recs-refresh"
              onClick={onRefresh}
              aria-label="Refresh recommendations"
            >
              <RefreshCw size={16} aria-hidden="true" />
              Refresh
            </button>
          )}
        </div>
        <p className="ai-recs-empty">
          No recommendations yet. Try refreshing or add more items to your lists.
        </p>
      </section>
    );
  }

  return (
    <section className="ai-recs" aria-label="AI Recommendations">
      <div className="ai-recs-header">
        <h3 className="ai-recs-title">
          <Sparkles size={20} aria-hidden="true" />
          AI Recommendations
        </h3>
        {onRefresh && (
          <button
            className="ai-recs-refresh"
            onClick={onRefresh}
            aria-label="Refresh recommendations"
          >
            <RefreshCw size={16} aria-hidden="true" />
            Refresh
          </button>
        )}
      </div>

      <div className="ai-recs-grid">
        {validRecs.map((rec) => {
          const id = rec.id || rec.title || Math.random();
          const isExpanded = !!expandedCards[id];
          const posterSrc = rec.poster_path
            ? `${TMDB_IMAGE_BASE}/${POSTER_SIZES.SMALL}${rec.poster_path}`
            : FALLBACK_POSTER;
          const matchPercent =
            rec.match != null ? Math.round(rec.match) : null;

          return (
            <article className="ai-rec-card" key={id}>
              <img
                className="ai-rec-poster"
                src={posterSrc}
                alt={`${rec.title || 'Recommendation'} poster`}
                loading="lazy"
                onError={(e) => {
                  e.target.src = FALLBACK_POSTER;
                }}
              />
              <div className="ai-rec-content">
                <div className="ai-rec-top">
                  <h4 className="ai-rec-title">
                    {rec.title || rec.name || 'Unknown Title'}
                  </h4>
                  {matchPercent != null && (
                    <span
                      className="ai-rec-match"
                      aria-label={`${matchPercent}% match`}
                    >
                      {matchPercent}% Match
                    </span>
                  )}
                </div>

                {rec.reason && (
                  <>
                    <p className="ai-rec-reason">
                      {isExpanded
                        ? rec.reason
                        : rec.reason.length > 100
                          ? rec.reason.slice(0, 100).trimEnd() + '…'
                          : rec.reason}
                    </p>
                    {rec.reason.length > 100 && (
                      <button
                        className="ai-rec-expand"
                        onClick={() => toggleExpand(id)}
                        aria-expanded={isExpanded}
                        aria-label={isExpanded ? 'Show less' : 'Why recommended'}
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp size={14} aria-hidden="true" />
                            Show less
                          </>
                        ) : (
                          <>
                            <ChevronDown size={14} aria-hidden="true" />
                            Why recommended
                          </>
                        )}
                      </button>
                    )}
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default memo(AiRecommendations);
