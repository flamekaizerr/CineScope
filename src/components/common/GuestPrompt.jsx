import { Link } from 'react-router-dom';
import { LogIn, Bookmark, Sparkles, User, Lock } from 'lucide-react';

/**
 * GuestPrompt — shown when a guest tries to access a personalization feature.
 * The rest of the app still works without login.
 *
 * @param {object} props
 * @param {string} [props.title] - heading
 * @param {string} [props.description] - sub-text
 * @param {'watchlist'|'recommendations'|'profile'} [props.feature] - which feature
 */
function GuestPrompt({
  title = 'Sign in to unlock this feature',
  description = 'Create your free account with Google to access personalized features.',
  feature = 'watchlist',
}) {
  const featureIcons = {
    watchlist: Bookmark,
    recommendations: Sparkles,
    profile: User,
  };

  const featureDetails = {
    watchlist: {
      perks: [
        'Save movies & shows to watch later',
        'Track what you\'re watching and completed',
        'Sync your list across all devices via Google Drive',
      ],
    },
    recommendations: {
      perks: [
        'AI-powered picks based on your taste',
        'Personalized "Because you watched" rows',
        'Continuously learns from your ratings',
      ],
    },
    profile: {
      perks: [
        'View your full viewing history & stats',
        'See your favorite genres breakdown',
        'Manage your Google Drive sync settings',
      ],
    },
  };

  const Icon = featureIcons[feature] ?? Lock;
  const perks = featureDetails[feature]?.perks ?? [];

  return (
    <div className="guest-prompt">
      <div className="guest-prompt-icon">
        <Icon size={32} />
      </div>

      <h2 className="guest-prompt-title">{title}</h2>
      <p className="guest-prompt-desc">{description}</p>

      {perks.length > 0 && (
        <ul className="guest-prompt-perks">
          {perks.map((perk) => (
            <li key={perk}>
              <Sparkles size={14} />
              {perk}
            </li>
          ))}
        </ul>
      )}

      <div className="guest-prompt-actions">
        <Link to="/login" className="btn btn-primary guest-prompt-btn">
          <LogIn size={18} />
          Sign in with Google — it&apos;s free
        </Link>
        <p className="guest-prompt-note">
          You can still browse movies, TV shows, and anime without signing in.
        </p>
      </div>
    </div>
  );
}

export default GuestPrompt;
