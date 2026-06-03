import { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Bookmark, Eye, CheckCircle, XCircle, List,
  SlidersHorizontal, Film, Tv, Sparkles, Star,
  ChevronDown, Trash2, ArrowUpDown
} from 'lucide-react';
import { useUserData } from '../context/UserDataContext';
import MediaCard from '../components/common/MediaCard';
import LoadingSkeleton from '../components/common/LoadingSkeleton';

const LIST_TABS = [
  { key: 'watchlist', label: 'Watchlist', icon: Bookmark },
  { key: 'watching', label: 'Watching', icon: Eye },
  { key: 'completed', label: 'Completed', icon: CheckCircle },
  { key: 'dropped', label: 'Dropped', icon: XCircle },
  { key: 'all', label: 'All', icon: List },
];

const SORT_OPTIONS = [
  { key: 'date_added', label: 'Date Added' },
  { key: 'title', label: 'Title' },
  { key: 'rating', label: 'Rating' },
  { key: 'year', label: 'Year' },
];

const MEDIA_FILTERS = [
  { key: 'all', label: 'All', icon: List },
  { key: 'movie', label: 'Movies', icon: Film },
  { key: 'tv', label: 'TV Shows', icon: Tv },
  { key: 'anime', label: 'Anime', icon: Sparkles },
];

function Watchlist() {
  const { items, removeItem, moveItem, isLoading: dataLoading } = useUserData();

  const [activeTab, setActiveTab] = useState('watchlist');
  const [sortBy, setSortBy] = useState('date_added');
  const [sortDirection, setSortDirection] = useState('desc');
  const [mediaFilter, setMediaFilter] = useState('all');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const handleRemove = useCallback((itemId, mediaType) => {
    removeItem(itemId, mediaType);
  }, [removeItem]);

  const handleMove = useCallback((itemId, mediaType, newList) => {
    moveItem(itemId, mediaType, newList);
  }, [moveItem]);

  const toggleSortDirection = useCallback(() => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  }, []);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let filtered = items || [];

    // Filter by list type
    if (activeTab !== 'all') {
      filtered = filtered.filter((item) => item.list === activeTab);
    }

    // Filter by media type
    if (mediaFilter !== 'all') {
      filtered = filtered.filter((item) => item.media_type === mediaFilter);
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let comparison;
      switch (sortBy) {
        case 'title':
          comparison = (a.title || '').localeCompare(b.title || '');
          break;
        case 'rating':
          comparison = (a.rating || 0) - (b.rating || 0);
          break;
        case 'year': {
          const yearA = a.release_date ? new Date(a.release_date).getFullYear() : 0;
          const yearB = b.release_date ? new Date(b.release_date).getFullYear() : 0;
          comparison = yearA - yearB;
          break;
        }
        case 'date_added':
        default:
          comparison = new Date(a.added_at || 0) - new Date(b.added_at || 0);
          break;
      }
      return sortDirection === 'desc' ? -comparison : comparison;
    });

    return sorted;
  }, [items, activeTab, mediaFilter, sortBy, sortDirection]);

  // Stats
  const stats = useMemo(() => {
    const allItems = items || [];
    const totalItems = allItems.length;
    const ratedItems = allItems.filter((i) => i.rating > 0);
    const avgRating = ratedItems.length > 0
      ? (ratedItems.reduce((sum, i) => sum + i.rating, 0) / ratedItems.length).toFixed(1)
      : 0;
    const watchlistCount = allItems.filter((i) => i.list === 'watchlist').length;
    const completedCount = allItems.filter((i) => i.list === 'completed').length;
    const watchingCount = allItems.filter((i) => i.list === 'watching').length;

    return { totalItems, avgRating, watchlistCount, completedCount, watchingCount };
  }, [items]);

  if (dataLoading) {
    return (
      <div className="page watchlist-page">
        <LoadingSkeleton type="page" />
      </div>
    );
  }

  const currentSortLabel = SORT_OPTIONS.find((s) => s.key === sortBy)?.label || 'Sort';

  return (
    <div className="page watchlist-page">
      <div className="page-header">
        <div className="page-title-row">
          <Bookmark size={28} />
          <h1>My List</h1>
        </div>

        {/* Stats Summary */}
        <div className="stat-cards-row">
          <div className="stat-card">
            <div className="stat-value">{filteredItems.length}</div>
            <div className="stat-label">Current View</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.watchlistCount}</div>
            <div className="stat-label">Watchlist</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.watchingCount}</div>
            <div className="stat-label">Watching</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.completedCount}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              <Star size={14} /> {stats.avgRating}
            </div>
            <div className="stat-label">Avg Rating</div>
          </div>
        </div>

        {/* List Tabs */}
        <div className="tabs">
          {LIST_TABS.map((tab) => {
            return (
              <button
                key={tab.key}
                className={`tab ${activeTab === tab.key ? 'tab-active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="page-content">
        {/* Filters & Sort */}
        <div className="filters-row">
          <div className="media-type-filters">
            {MEDIA_FILTERS.map((filter) => (
              <button
                key={filter.key}
                className={`tab ${mediaFilter === filter.key ? 'tab-active' : ''}`}
                onClick={() => setMediaFilter(filter.key)}
              >
                <filter.icon size={14} />
                {filter.label}
              </button>
            ))}
          </div>

          <div className="sort-controls">
            <div className="sort-dropdown-wrapper">
              <button
                className="sort-btn"
                onClick={() => setShowSortDropdown(!showSortDropdown)}
              >
                <SlidersHorizontal size={16} />
                {currentSortLabel}
                <ChevronDown size={14} />
              </button>
              {showSortDropdown && (
                <div className="sort-dropdown">
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option.key}
                      className={`sort-option ${sortBy === option.key ? 'sort-option-active' : ''}`}
                      onClick={() => { setSortBy(option.key); setShowSortDropdown(false); }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="sort-direction-btn" onClick={toggleSortDirection} title="Toggle sort direction">
              <ArrowUpDown size={16} />
            </button>
          </div>
        </div>

        {/* Items Grid */}
        {filteredItems.length > 0 ? (
          <div className="media-grid">
            {filteredItems.map((item) => (
              <div key={`${item.media_type}-${item.id}`} className="watchlist-card-wrapper">
                <MediaCard
                  item={item}
                  mediaType={item.media_type}
                />
                {item.rating > 0 && (
                  <div className="watchlist-user-rating">
                    <Star size={12} /> {item.rating}/10
                  </div>
                )}
                <div className="watchlist-card-actions">
                  {/* Move to other list */}
                  <select
                    className="watchlist-move-select"
                    value={item.list || ''}
                    onChange={(e) => handleMove(item.id, item.media_type, e.target.value)}
                  >
                    <option value="watchlist">Watchlist</option>
                    <option value="watching">Watching</option>
                    <option value="completed">Completed</option>
                    <option value="dropped">Dropped</option>
                  </select>
                  <button
                    className="btn btn-icon btn-danger"
                    onClick={() => handleRemove(item.id, item.media_type)}
                    title="Remove"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Bookmark size={48} />
            <h3>
              {activeTab === 'all'
                ? 'Your list is empty'
                : `No items in ${LIST_TABS.find((t) => t.key === activeTab)?.label || activeTab}`}
            </h3>
            <p>Start adding movies, TV shows, and anime to build your personal collection.</p>
            <Link to="/" className="btn btn-primary">Explore Content</Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default Watchlist;
