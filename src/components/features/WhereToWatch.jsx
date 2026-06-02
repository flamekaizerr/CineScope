import { memo } from 'react';
import { ExternalLink } from 'lucide-react';

const SECTION_LABELS = {
  flatrate: 'Stream',
  rent: 'Rent',
  buy: 'Buy',
};

const TMDB_LOGO_BASE = 'https://image.tmdb.org/t/p/original';

/**
 * WhereToWatch – Displays streaming/rent/buy provider logos.
 * Data comes from TMDB's watch/providers endpoint.
 */
function WhereToWatch({ providers }) {
  if (!providers) return null;

  const { flatrate, rent, buy, link } = providers;
  const hasSections =
    (flatrate && flatrate.length > 0) ||
    (rent && rent.length > 0) ||
    (buy && buy.length > 0);

  if (!hasSections) {
    return (
      <section className="where-to-watch" aria-label="Where to watch">
        <p className="where-to-watch-empty">
          No streaming information available for your region.
        </p>
      </section>
    );
  }

  const renderSection = (key, items) => {
    if (!items || items.length === 0) return null;
    const label = SECTION_LABELS[key] || key;
    return (
      <div className="provider-section" key={key}>
        <h4 className="provider-section-title">{label}</h4>
        <div className="provider-grid">
          {items.map((provider) => (
            <div
              key={provider.provider_id}
              className="provider-item"
              title={provider.provider_name}
            >
              {provider.logo_path ? (
                <img
                  className="provider-logo"
                  src={`${TMDB_LOGO_BASE}${provider.logo_path}`}
                  alt={provider.provider_name}
                  loading="lazy"
                />
              ) : (
                <div className="provider-logo provider-logo-fallback" aria-label={provider.provider_name}>
                  {(provider.provider_name || '?').charAt(0)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <section className="where-to-watch" aria-label="Where to watch">
      <h3 className="where-to-watch-title">Where to Watch</h3>
      {renderSection('flatrate', flatrate)}
      {renderSection('rent', rent)}
      {renderSection('buy', buy)}
      <p className="provider-attribution">
        <ExternalLink size={14} aria-hidden="true" />
        <span>Data provided by </span>
        <a
          href={link || 'https://www.justwatch.com'}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="JustWatch attribution (opens in new tab)"
        >
          JustWatch
        </a>
      </p>
    </section>
  );
}

export default memo(WhereToWatch);
