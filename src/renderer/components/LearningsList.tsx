/**
 * LearningsList Component
 * [AI-29] Build LearningsList component
 *
 * Displays all learnings from the database with filtering by category/topic,
 * visual indicators for categories, and traceability to source logs.
 */

import React, { useState, useMemo } from 'react';
import type { Learning } from '@types/database';

/**
 * Extended Learning type with optional log metadata for display
 */
export interface LearningWithLog extends Learning {
  logDate?: string;
  logSummary?: string;
}

/**
 * Props for LearningsList component
 */
export interface LearningsListProps {
  /** Array of learnings to display */
  learnings: LearningWithLog[];
  /** Callback when a learning is clicked to view source log */
  onViewLog?: (logId: number) => void;
  /** Loading state */
  isLoading?: boolean;
  /** Error message if fetch failed */
  error?: string;
  /** Show filter controls */
  showFilter?: boolean;
}

/**
 * Props for individual LearningItem component
 */
interface LearningItemProps {
  learning: LearningWithLog;
  onViewLog?: (logId: number) => void;
}

/**
 * Get color class for a category badge
 */
function getCategoryColor(category: string | null): string {
  if (!category) {
    return 'bg-gray-100 text-gray-700 border-gray-300';
  }

  // Hash the category name to get consistent colors
  const hash = category.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  const colors = [
    'bg-blue-100 text-blue-700 border-blue-300',
    'bg-green-100 text-green-700 border-green-300',
    'bg-purple-100 text-purple-700 border-purple-300',
    'bg-yellow-100 text-yellow-700 border-yellow-300',
    'bg-pink-100 text-pink-700 border-pink-300',
    'bg-indigo-100 text-indigo-700 border-indigo-300',
    'bg-red-100 text-red-700 border-red-300',
    'bg-orange-100 text-orange-700 border-orange-300',
  ];

  return colors[Math.abs(hash) % colors.length];
}

/**
 * Format date string for display
 */
function formatDate(dateString: string | undefined): string {
  if (!dateString) {
    return 'Unknown date';
  }

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Individual learning item component
 */
function LearningItem({ learning, onViewLog }: LearningItemProps): JSX.Element {
  const categoryColor = getCategoryColor(learning.category);

  return (
    <div
      className="
        bg-white rounded-lg border border-gray-200 p-4
        hover:shadow-md hover:border-blue-300 transition-all duration-200
        group
      "
      data-testid="learning-item"
    >
      {/* Header with category badge */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1">
          {/* Category Badge */}
          {learning.category && (
            <span
              className={`
                inline-block px-2 py-1 text-xs font-medium rounded-md border
                ${categoryColor}
              `}
              data-testid="category-badge"
            >
              {learning.category}
            </span>
          )}
        </div>

        {/* Date */}
        <span className="text-xs text-gray-500" data-testid="learning-date">
          {formatDate(learning.logDate || learning.createdAt)}
        </span>
      </div>

      {/* Learning Text */}
      <p className="text-gray-800 text-sm leading-relaxed mb-3" data-testid="learning-text">
        {learning.text}
      </p>

      {/* Footer with View Log link */}
      {onViewLog && (
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <button
            onClick={() => onViewLog(learning.logId)}
            className="
              text-xs text-blue-600 hover:text-blue-800 font-medium
              flex items-center gap-1
              transition-colors
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded
            "
            aria-label={`View source log for learning: ${learning.text}`}
            data-testid="view-log-button"
          >
            <svg
              className="w-3 h-3"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View source log
          </button>

          {/* Optional log summary preview */}
          {learning.logSummary && (
            <span className="text-xs text-gray-400 truncate max-w-xs" title={learning.logSummary}>
              {learning.logSummary}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * LearningsList Component
 *
 * Displays a filterable list of all learnings from the database.
 * Features:
 * - Category/topic badge for each learning
 * - Filter by category
 * - Click to view source log
 * - Loading and error states
 */
export function LearningsList({
  learnings,
  onViewLog,
  isLoading = false,
  error,
  showFilter = true,
}: LearningsListProps): JSX.Element {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Get unique categories from learnings
  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    learnings.forEach((learning) => {
      if (learning.category) {
        categorySet.add(learning.category);
      }
    });
    return Array.from(categorySet).sort();
  }, [learnings]);

  // Filter learnings by selected category and search query
  const filteredLearnings = useMemo(() => {
    return learnings.filter((learning) => {
      // Filter by category
      if (selectedCategory && learning.category !== selectedCategory) {
        return false;
      }

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesText = learning.text.toLowerCase().includes(query);
        const matchesCategory = learning.category?.toLowerCase().includes(query);
        return matchesText || matchesCategory;
      }

      return true;
    });
  }, [learnings, selectedCategory, searchQuery]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <span className="text-sm text-gray-600">Loading learnings...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className="bg-red-50 border border-red-200 rounded-lg p-4 text-center"
        role="alert"
        aria-live="assertive"
      >
        <div className="flex items-center justify-center gap-2 text-red-700 mb-2">
          <svg
            className="w-5 h-5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-semibold">Error loading learnings</span>
        </div>
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  // Empty state
  if (learnings.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No learnings yet</h3>
        <p className="text-sm text-gray-500">
          Learnings will appear here as you record and analyze your thoughts.
        </p>
      </div>
    );
  }

  // No results after filtering
  if (filteredLearnings.length === 0) {
    return (
      <div className="space-y-4">
        {/* Filter Controls */}
        {showFilter && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            {/* Search Input */}
            <div>
              <label htmlFor="search" className="sr-only">
                Search learnings
              </label>
              <input
                id="search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search learnings..."
                className="
                  w-full px-3 py-2 text-sm border border-gray-300 rounded-md
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                "
                data-testid="search-input"
              />
            </div>

            {/* Category Filter */}
            {categories.length > 0 && (
              <div>
                <label htmlFor="category-filter" className="sr-only">
                  Filter by category
                </label>
                <select
                  id="category-filter"
                  value={selectedCategory || ''}
                  onChange={(e) => setSelectedCategory(e.target.value || null)}
                  className="
                    w-full px-3 py-2 text-sm border border-gray-300 rounded-md
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  "
                  data-testid="category-filter"
                >
                  <option value="">All categories ({learnings.length})</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category} ({learnings.filter((l) => l.category === category).length})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* No Results Message */}
        <div className="text-center py-8">
          <p className="text-gray-600 mb-2">No learnings match your filters</p>
          <button
            onClick={() => {
              setSelectedCategory(null);
              setSearchQuery('');
            }}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear filters
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      {showFilter && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3" data-testid="filter-controls">
          {/* Search Input */}
          <div>
            <label htmlFor="search" className="sr-only">
              Search learnings
            </label>
            <input
              id="search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search learnings..."
              className="
                w-full px-3 py-2 text-sm border border-gray-300 rounded-md
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              "
              data-testid="search-input"
            />
          </div>

          {/* Category Filter */}
          {categories.length > 0 && (
            <div>
              <label htmlFor="category-filter" className="sr-only">
                Filter by category
              </label>
              <select
                id="category-filter"
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="
                  w-full px-3 py-2 text-sm border border-gray-300 rounded-md
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                "
                data-testid="category-filter"
              >
                <option value="">All categories ({learnings.length})</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category} ({learnings.filter((l) => l.category === category).length})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Active Filter Info */}
          {(selectedCategory || searchQuery) && (
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>
                Showing {filteredLearnings.length} of {learnings.length} learnings
              </span>
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setSearchQuery('');
                }}
                className="text-blue-600 hover:text-blue-800 font-medium"
                data-testid="clear-filters-button"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Learnings List */}
      <div className="space-y-3" role="list" aria-label="Learnings list">
        {filteredLearnings.map((learning) => (
          <LearningItem key={learning.id} learning={learning} onViewLog={onViewLog} />
        ))}
      </div>

      {/* Results Count */}
      <div className="text-center text-xs text-gray-500 pt-2">
        {filteredLearnings.length === learnings.length
          ? `${learnings.length} ${learnings.length === 1 ? 'learning' : 'learnings'} total`
          : `Showing ${filteredLearnings.length} of ${learnings.length} learnings`}
      </div>
    </div>
  );
}
