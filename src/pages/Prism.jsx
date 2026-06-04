import { useState, useCallback, useEffect } from 'react';
import { Moon, Film, SlidersHorizontal, ChevronDown, Globe, Lock } from 'lucide-react';
import { MEDIA_TYPES } from '../utils/constants';
import MediaCard from '../components/common/MediaCard';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import { useSessionStorage } from '../hooks/useSessionStorage';

// ---------------------------------------------------------------------------
// Region catalogue — global cinema
// ---------------------------------------------------------------------------
const REGIONS = [
  { key: 'all',  label: '🌍 All Regions',      country: undefined, lang: undefined },
  { key: 'us',   label: '🇺🇸 American',         country: 'US',      lang: 'en', cert: 'R|NC-17' },
  { key: 'eu',   label: '🇪🇺 European',         country: undefined, lang: undefined, multiCountry: 'FR|IT|ES|DE|NL|SE|DK|NO|BE|AT|CH|PL|CZ|HU|RO|GR|PT' },
  { key: 'fr',   label: '🇫🇷 French',           country: 'FR',      lang: 'fr', cert: '16|18' },
  { key: 'it',   label: '🇮🇹 Italian',          country: 'IT',      lang: 'it', cert: 'VM14|VM18' },
  { key: 'es',   label: '🇪🇸 Spanish',          country: 'ES',      lang: 'es', cert: '16|18' },
  { key: 'de',   label: '🇩🇪 German',           country: 'DE',      lang: 'de', cert: '16|18' },
  { key: 'pl',   label: '🇵🇱 Polish',           country: 'PL',      lang: 'pl', cert: '15|18' },
  { key: 'cz',   label: '🇨🇿 Czech',            country: 'CZ',      lang: 'cs', cert: '15|18' },
  { key: 'scan', label: '🇸🇪 Scandinavian',     country: undefined, lang: undefined, multiCountry: 'SE|NO|DK|FI|IS' },
  { key: 'la',   label: '🌎 Latin American',    country: undefined, lang: 'es',     multiCountry: 'MX|AR|BR|CO|CL|PE|VE|EC|UY|PY|BO' },
  { key: 'br',   label: '🇧🇷 Brazilian',        country: 'BR',      lang: 'pt', cert: '16|18' },
  { key: 'jp',   label: '🇯🇵 Japanese',         country: 'JP',      lang: 'ja', cert: 'R15+|R18+' },
  { key: 'kr',   label: '🇰🇷 Korean',           country: 'KR',      lang: 'ko', cert: '15|18|19' },
  { key: 'cn',   label: '🇨🇳 Chinese',          country: 'CN',      lang: 'zh' },
  { key: 'ph',   label: '🇵🇭 Filipino',         country: 'PH',      lang: 'tl', cert: 'R-16|R-18' },
  { key: 'in',   label: '🇮🇳 Indian',           country: 'IN',      lang: undefined, cert: 'A' },
  { key: 'me',   label: '🌙 Middle Eastern',    country: undefined, lang: undefined, multiCountry: 'TR|IL|LB|EG|MA|TN|DZ|JO|IQ|IR|SA|AE' },
  { key: 'tr',   label: '🇹🇷 Turkish',          country: 'TR',      lang: 'tr', cert: '15+|18+' },
];

const SORT_OPTIONS = [
  { key: 'vote_average.desc',         label: '⭐ Highest Rated' },
  { key: 'popularity.desc',           label: '🔥 Most Popular' },
  { key: 'primary_release_date.desc', label: '🆕 Newest First' },
  { key: 'primary_release_date.asc',  label: '📅 Oldest First' },
];

const TYPE_OPTIONS = [
  { key: 'movie', label: 'Movies' },
  { key: 'tv',    label: 'TV Shows' },
];

// ---------------------------------------------------------------------------
// Auth gate
// ---------------------------------------------------------------------------
function PrismAuth({ onUnlock }) {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (data.ok) {
        localStorage.setItem('prism_unlocked', 'true');
        if (data.config) {
          localStorage.setItem('prism_config', JSON.stringify(data.config));
        }
        onUnlock();
      } else {
        setError('Invalid token.');
      }
    } catch {
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '60vh', gap: '1.5rem',
      color: 'var(--color-text-muted)'
    }}>
      <Lock size={40} />
      <h2 style={{ color: 'var(--color-text)', fontSize: 'var(--text-xl)' }}>Prism</h2>
      <p style={{ fontSize: 'var(--text-sm)' }}>Enter your access token to continue.</p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', maxWidth: '320px' }}>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Token"
          autoFocus
          style={{
            padding: '0.625rem 0.875rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            fontSize: 'var(--text-sm)',
            outline: 'none',
          }}
        />
        {error && <p style={{ color: 'var(--color-error)', fontSize: 'var(--text-xs)' }}>{error}</p>}
        <button
          type="submit"
          disabled={loading || !token}
          style={{
            padding: '0.625rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-primary)',
            color: '#fff',
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading || !token ? 0.6 : 1,
          }}
        >
          {loading ? 'Checking...' : 'Unlock'}
        </button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Prism page
// ---------------------------------------------------------------------------
function PrismContent() {
  const [sortBy, setSortBy]           = useSessionStorage('prism_sort', 'popularity.desc');
  const [mediaType, setMediaType]     = useSessionStorage('prism_type', 'movie');
  const [region, setRegion]           = useSessionStorage('prism_region', 'all');
  const [page, setPage]               = useSessionStorage('prism_page', 1);
  const [allItems, setAllItems]       = useState([]);
  const [loading, setLoading]         = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalPages, setTotalPages]   = useState(1);
  const [showSort, setShowSort]       = useState(false);
  const [error, setError]             = useState(null);

  const buildParams = useCallback((p = 1) => {
    const r = REGIONS.find((x) => x.key === region) || REGIONS[0];
    const dateKey = mediaType === 'movie' ? 'primary_release_date' : 'first_air_date';
    
    const sessionConfig = localStorage.getItem('prism_config');
    const config = sessionConfig ? JSON.parse(sessionConfig) : {};
    const { _filterKey, _filterValue, ...extraParams } = config;

    return {
      page: p,
      sort_by: sortBy,
      'vote_count.gte': sortBy === 'vote_average.desc' ? 50 : 5,
      with_original_language: r.lang,
      with_origin_country: r.multiCountry || r.country,
      certification_country: r.country && r.cert ? r.country : undefined,
      certification: r.cert,
      [`${dateKey}.lte`]: new Date().toISOString().slice(0, 10),
      ...extraParams,
    };
  }, [sortBy, mediaType, region]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setAllItems([]);
    setPage(1);

    (async () => {
      try {
        const res = await fetch(
          `/api/tmdb?path=/discover/${mediaType}&${new URLSearchParams(
            Object.fromEntries(
              Object.entries(buildParams(1)).filter(([, v]) => v !== undefined && v !== null && v !== '')
            )
          )}`
        );
        const data = await res.json();
        
        let results = data.results || [];
        const sessionConfig = localStorage.getItem('prism_config');
        const config = sessionConfig ? JSON.parse(sessionConfig) : {};
        if (config._filterKey !== undefined) {
          results = results.filter(item => item[config._filterKey] === config._filterValue);
        }

        if (!cancelled) {
          setAllItems(results);
          setTotalPages(data.total_pages || 1);
        }
      } catch (err) {
        if (!cancelled) setError('Failed to load. Try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [sortBy, mediaType, region, buildParams]);

  const handleLoadMore = async () => {
    const next = page + 1;
    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/tmdb?path=/discover/${mediaType}&${new URLSearchParams(
          Object.fromEntries(
            Object.entries(buildParams(next)).filter(([, v]) => v !== undefined && v !== null && v !== '')
          )
        )}`
      );
      const data = await res.json();
      
      let results = data.results || [];
      const sessionConfig = localStorage.getItem('prism_config');
      const config = sessionConfig ? JSON.parse(sessionConfig) : {};
      if (config._filterKey !== undefined) {
        results = results.filter(item => item[config._filterKey] === config._filterValue);
      }

      setAllItems((prev) => [...prev, ...results]);
      setPage(next);
    } catch (err) {
      console.error('Load more failed', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const currentSortLabel = SORT_OPTIONS.find((s) => s.key === sortBy)?.label || 'Sort';

  return (
    <div className="page movies-page">
      <div className="page-header">
        <div className="page-title-row">
          <Moon size={28} />
          <h1>Prism</h1>
        </div>
        <p className="page-subtitle">
          Experimental & avant-garde global cinema — rare cuts and obscure finds. Rated &amp; reviewed on TMDB.
        </p>
      </div>

      <div className="page-content">
        <section className="browse-control-panel browse-control-panel-compact">
          <div className="browse-inline-toolbar">
            <div className="browse-chip-row browse-chip-row-tight">
              {TYPE_OPTIONS.map((t) => (
                <button
                  key={t.key}
                  className={`browse-chip ${mediaType === t.key ? 'browse-chip-active' : ''}`}
                  onClick={() => setMediaType(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="sort-dropdown-wrapper">
              <button className="sort-btn" onClick={() => setShowSort(!showSort)}>
                <SlidersHorizontal size={16} />
                {currentSortLabel}
                <ChevronDown size={14} />
              </button>
              {showSort && (
                <div className="sort-dropdown">
                  {SORT_OPTIONS.map((o) => (
                    <button
                      key={o.key}
                      className={`sort-option ${sortBy === o.key ? 'sort-option-active' : ''}`}
                      onClick={() => { setSortBy(o.key); setShowSort(false); }}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="browse-chip-row" aria-label="Region filter" style={{ flexWrap: 'wrap' }}>
            <Globe size={15} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
            {REGIONS.map((r) => (
              <button
                key={r.key}
                className={`browse-chip ${region === r.key ? 'browse-chip-active' : ''}`}
                onClick={() => setRegion(r.key)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </section>

        {loading ? (
          <div className="media-grid">
            {Array.from({ length: 12 }).map((_, i) => <LoadingSkeleton key={i} type="card" />)}
          </div>
        ) : error ? (
          <div className="error-state"><p>{error}</p></div>
        ) : allItems.length > 0 ? (
          <>
            <div className="media-grid">
              {allItems.map((item) => (
                <MediaCard
                  key={item.id}
                  item={item}
                  mediaType={mediaType === 'movie' ? MEDIA_TYPES.MOVIE : MEDIA_TYPES.TV}
                />
              ))}
            </div>
            {page < totalPages && (
              <div className="load-more-container">
                <button className="load-more-btn" onClick={handleLoadMore} disabled={loadingMore}>
                  {loadingMore ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <Film size={48} />
            <h3>{page < totalPages ? 'No matching titles on this page' : 'Nothing found'}</h3>
            <p>{page < totalPages ? 'Click below to continue searching the database.' : 'Try a different region or media type.'}</p>
            {page < totalPages && (
              <button 
                className="load-more-btn" 
                onClick={handleLoadMore} 
                disabled={loadingMore}
                style={{ marginTop: '1.5rem' }}
              >
                {loadingMore ? 'Searching...' : 'Search Next Page'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Export — checks session, shows auth gate or content
// ---------------------------------------------------------------------------
export default function Prism() {
  const [unlocked, setUnlocked] = useState(
    localStorage.getItem('prism_unlocked') === 'true'
  );

  if (!unlocked) {
    return <PrismAuth onUnlock={() => setUnlocked(true)} />;
  }
  return <PrismContent />
}
