/**
 * IdeasList Component
 * [AI-28] Build IdeasList component with status management
 *
 * Displays all ideas from the database with filtering, status management,
 * and traceability to source logs.
 */

import React, { useState, useEffect } from 'react';
import type { Idea, IdeaStatus } from '../../types/database';

/**
 * Props for IdeasList component
 */
export interface IdeasListProps {
  /** Array of ideas to display */
  ideas: Idea[];
  /** Callback when idea status is changed */
  onStatusChange?: (ideaId: number, newStatus: IdeaStatus) => void;
  /** Callback when user clicks to view source log */
  onViewLog?: (logId: number) => void;
  /** Whether the component is in loading state */
  loading?: boolean;
  /** Error message to display */
  error?: string;
  /** Callback to retry loading ideas */
  onRetry?: () => void;
}

/**
 * Status badge configuration
 */
const STATUS_CONFIG: Record<IdeaStatus, { label: string; color: string; bgColor: string; borderColor: string }> = {
  raw: {
    label: 'New',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  developing: {
    label: 'Exploring',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  actionable: {
    label: 'Actionable',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  archived: {
    label: 'Archived',
    color: 'text-gray-700',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
  },
};

/**
 * Maps database status to display status
 */
function mapDatabaseStatus(dbStatus: IdeaStatus): string {
  const mapping: Record<IdeaStatus, string> = {
    raw: 'new',
    developing: 'exploring',
    actionable: 'done',
    archived: 'parked',
  };
  return mapping[dbStatus] || dbStatus;
}

/**
 * Maps display status to database status
 */
function mapDisplayStatus(displayStatus: string): IdeaStatus {
  const mapping: Record<string, IdeaStatus> = {
    new: 'raw',
    exploring: 'developing',
    done: 'actionable',
    parked: 'archived',
  };
  return mapping[displayStatus] || (displayStatus as IdeaStatus);
}

/**
 * Confidence score indicator component
 */
function ConfidenceIndicator({ score }: { score?: number }): JSX.Element | null {
  if (score === undefined || score === null) {
    return null;
  }

  const percentage = Math.round(score * 100);
  let color = 'text-red-600';
  let bgColor = 'bg-red-100';

  if (percentage >= 70) {
    color = 'text-green-600';
    bgColor = 'bg-green-100';
  } else if (percentage >= 40) {
    color = 'text-yellow-600';
    bgColor = 'bg-yellow-100';
  }

  return (
    <div className="flex items-center gap-1" title={`Confidence: ${percentage}%`}>
      <div className={`px-2 py-0.5 rounded text-xs font-medium ${color} ${bgColor}`}>
        {percentage}%
      </div>
    </div>
  );
}

/**
 * Category badge component
 */
function CategoryBadge({ tags }: { tags: string | null }): JSX.Element | null {
  if (!tags) {
    return null;
  }

  let parsedTags: string[] = [];
  try {
    parsedTags = JSON.parse(tags);
  } catch {
    return null;
  }

  if (!Array.isArray(parsedTags) || parsedTags.length === 0) {
    return null;
  }

  // Show only the first tag for compact display
  const firstTag = parsedTags[0];

  return (
    <div
      className="px-2 py-0.5 rounded text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200"
      title={parsedTags.length > 1 ? `Also: ${parsedTags.slice(1).join(', ')}` : undefined}
    >
      {firstTag}
      {parsedTags.length > 1 && ` +${parsedTags.length - 1}`}
    </div>
  );
}

/**
 * Status filter component
 */
function StatusFilter({
  currentFilter,
  onFilterChange,
}: {
  currentFilter: string;
  onFilterChange: (status: string) => void;
}): JSX.Element {
  const filterOptions = [
    { value: 'all', label: 'All Ideas' },
    { value: 'new', label: 'New' },
    { value: 'exploring', label: 'Exploring' },
    { value: 'parked', label: 'Parked' },
    { value: 'done', label: 'Done' },
  ];

  return (
    <div className="flex gap-2 flex-wrap">
      {filterOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => onFilterChange(option.value)}
          className={`
            px-3 py-1.5 rounded-md text-sm font-medium transition-colors
            ${
              currentFilter === option.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          `}
          aria-pressed={currentFilter === option.value}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Individual idea item component
 */
function IdeaItem({
  idea,
  onStatusChange,
  onViewLog,
}: {
  idea: Idea;
  onStatusChange?: (ideaId: number, newStatus: IdeaStatus) => void;
  onViewLog?: (logId: number) => void;
}): JSX.Element {
  const displayStatus = mapDatabaseStatus(idea.status);
  const config = STATUS_CONFIG[idea.status];

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDisplayStatus = e.target.value;
    const newDbStatus = mapDisplayStatus(newDisplayStatus);
    if (onStatusChange) {
      onStatusChange(idea.id, newDbStatus);
    }
  };

  // Parse confidence from tags or use a default
  // In the actual database schema, confidence isn't stored on ideas
  // but we'll prepare for it in case it's added
  const confidence = undefined;

  return (
    <div
      className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
      data-testid={`idea-item-${idea.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          <p className="text-gray-900 mb-2">{idea.text}</p>

          {/* Metadata row */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Category badge */}
            <CategoryBadge tags={idea.tags} />

            {/* Confidence indicator */}
            <ConfidenceIndicator score={confidence} />

            {/* Source log link */}
            {onViewLog && (
              <button
                onClick={() => onViewLog(idea.logId)}
                className="
                  text-xs text-blue-600 hover:text-blue-800 hover:underline
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded
                "
                aria-label={`View source log ${idea.logId}`}
              >
                View source log
              </button>
            )}

            {/* Created date */}
            <span className="text-xs text-gray-500">
              {new Date(idea.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Status dropdown */}
        <div className="flex-shrink-0">
          <select
            value={displayStatus}
            onChange={handleStatusChange}
            className={`
              px-3 py-1.5 rounded-md text-sm font-medium border-2
              ${config.color} ${config.bgColor} ${config.borderColor}
              focus:outline-none focus:ring-2 focus:ring-blue-500
              cursor-pointer
            `}
            aria-label={`Status for idea: ${idea.text.substring(0, 50)}`}
            disabled={!onStatusChange}
          >
            <option value="new">New</option>
            <option value="exploring">Exploring</option>
            <option value="parked">Parked</option>
            <option value="done">Done</option>
          </select>
        </div>
      </div>
    </div>
  );
}

/**
 * IdeasList Component
 *
 * Displays a list of ideas with filtering and status management capabilities.
 */
export function IdeasList({
  ideas,
  onStatusChange,
  onViewLog,
  loading = false,
  error,
  onRetry,
}: IdeasListProps): JSX.Element {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter ideas based on selected status
  const filteredIdeas = ideas.filter((idea) => {
    if (statusFilter === 'all') {
      return true;
    }
    const displayStatus = mapDatabaseStatus(idea.status);
    return displayStatus === statusFilter;
  });

  // Loading state
  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-flex items-center gap-2 text-gray-600">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
          <span>Loading ideas...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="text-red-600 mb-4">
            <svg
              className="w-12 h-12 mx-auto mb-2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="font-semibold">Failed to load ideas</p>
            <p className="text-sm text-gray-600 mt-1">{error}</p>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="
                px-4 py-2 bg-red-600 text-white rounded-md
                hover:bg-red-700 transition-colors
                focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
              "
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  // Empty state
  if (ideas.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <svg
          className="w-16 h-16 mx-auto mb-4 text-gray-400"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <p className="font-medium">No ideas yet</p>
        <p className="text-sm mt-1">Ideas from your recordings will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Ideas
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({filteredIdeas.length} {filteredIdeas.length === 1 ? 'idea' : 'ideas'})
          </span>
        </h2>
        <StatusFilter currentFilter={statusFilter} onFilterChange={setStatusFilter} />
      </div>

      {/* Ideas list */}
      {filteredIdeas.length === 0 ? (
        <div className="p-8 text-center text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
          <p>No ideas match the selected filter</p>
          <button
            onClick={() => setStatusFilter('all')}
            className="mt-2 text-blue-600 hover:text-blue-800 text-sm underline focus:outline-none"
          >
            Show all ideas
          </button>
        </div>
      ) : (
        <div className="space-y-3" role="list" aria-label="Ideas list">
          {filteredIdeas.map((idea) => (
            <IdeaItem
              key={idea.id}
              idea={idea}
              onStatusChange={onStatusChange}
              onViewLog={onViewLog}
            />
          ))}
        </div>
      )}
    </div>
  );
}
