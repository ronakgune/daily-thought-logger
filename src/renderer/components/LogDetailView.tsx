/**
 * LogDetailView Component
 * AI-32: Add item-to-log traceability links
 *
 * Displays a detailed view of a log entry with all its extracted items.
 * Can highlight a specific item when navigating from an item view.
 */

import React, { useEffect, useRef } from 'react';
import type { LogWithSegments } from '../../types/database';

export interface LogDetailViewProps {
  /** The log with all its segments to display */
  log: LogWithSegments;
  /** Optional ID of an item to highlight */
  highlightItemId?: number;
  /** Optional type of the highlighted item */
  highlightItemType?: 'todo' | 'idea' | 'learning' | 'accomplishment';
  /** Callback when back navigation is requested */
  onBack?: () => void;
  /** Optional CSS class for styling */
  className?: string;
}

/**
 * Formats a date string to a readable format
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Formats a timestamp to time only
 */
function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * LogDetailView shows a complete log entry with all extracted segments.
 *
 * Features:
 * - Displays log date, transcript, and summary
 * - Shows all extracted items (todos, ideas, learnings, accomplishments)
 * - Highlights a specific item when navigating from item view
 * - Auto-scrolls to highlighted item
 * - Provides back navigation
 */
export const LogDetailView: React.FC<LogDetailViewProps> = ({
  log,
  highlightItemId,
  highlightItemType,
  onBack,
  className = '',
}) => {
  const highlightRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to highlighted item when component mounts
  useEffect(() => {
    if (highlightRef.current && highlightItemId) {
      // Check if scrollIntoView exists (not available in jsdom test environment)
      if (typeof highlightRef.current.scrollIntoView === 'function') {
        highlightRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [highlightItemId]);

  /**
   * Checks if an item should be highlighted
   */
  const isHighlighted = (
    itemId: number,
    itemType: 'todo' | 'idea' | 'learning' | 'accomplishment'
  ): boolean => {
    return highlightItemId === itemId && highlightItemType === itemType;
  };

  return (
    <div className={`log-detail-view ${className}`} data-testid="log-detail-view">
      {/* Header with back button */}
      {onBack && (
        <div className="log-detail-header" data-testid="log-detail-header">
          <button
            className="back-button"
            onClick={onBack}
            data-testid="back-button"
            aria-label="Go back"
          >
            ← Back
          </button>
        </div>
      )}

      {/* Log metadata */}
      <div className="log-metadata" data-testid="log-metadata">
        <h2 className="log-date" data-testid="log-date">
          {formatDate(log.date)}
        </h2>
        <div className="log-timestamp" data-testid="log-timestamp">
          Created at {formatTime(log.createdAt)}
        </div>
      </div>

      {/* Transcript section */}
      {log.transcript && (
        <div className="log-section" data-testid="transcript-section">
          <h3 className="section-title">Transcript</h3>
          <div className="transcript-content" data-testid="transcript-content">
            {log.transcript}
          </div>
        </div>
      )}

      {/* Summary section */}
      {log.summary && (
        <div className="log-section" data-testid="summary-section">
          <h3 className="section-title">Summary</h3>
          <div className="summary-content" data-testid="summary-content">
            {log.summary}
          </div>
        </div>
      )}

      {/* Todos section */}
      {log.todos.length > 0 && (
        <div className="log-section" data-testid="todos-section">
          <h3 className="section-title">Todos ({log.todos.length})</h3>
          <div className="items-list">
            {log.todos.map((todo) => (
              <div
                key={`todo-${todo.id}`}
                ref={isHighlighted(todo.id, 'todo') ? highlightRef : null}
                className={`item ${isHighlighted(todo.id, 'todo') ? 'highlighted' : ''}`}
                data-testid={`todo-item-${todo.id}`}
                data-highlighted={isHighlighted(todo.id, 'todo')}
              >
                <div className="item-text">{todo.text}</div>
                <div className="item-meta">
                  Priority: {todo.priority} | {todo.completed ? 'Completed' : 'Pending'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ideas section */}
      {log.ideas.length > 0 && (
        <div className="log-section" data-testid="ideas-section">
          <h3 className="section-title">Ideas ({log.ideas.length})</h3>
          <div className="items-list">
            {log.ideas.map((idea) => (
              <div
                key={`idea-${idea.id}`}
                ref={isHighlighted(idea.id, 'idea') ? highlightRef : null}
                className={`item ${isHighlighted(idea.id, 'idea') ? 'highlighted' : ''}`}
                data-testid={`idea-item-${idea.id}`}
                data-highlighted={isHighlighted(idea.id, 'idea')}
              >
                <div className="item-text">{idea.text}</div>
                <div className="item-meta">Status: {idea.status}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Learnings section */}
      {log.learnings.length > 0 && (
        <div className="log-section" data-testid="learnings-section">
          <h3 className="section-title">Learnings ({log.learnings.length})</h3>
          <div className="items-list">
            {log.learnings.map((learning) => (
              <div
                key={`learning-${learning.id}`}
                ref={isHighlighted(learning.id, 'learning') ? highlightRef : null}
                className={`item ${isHighlighted(learning.id, 'learning') ? 'highlighted' : ''}`}
                data-testid={`learning-item-${learning.id}`}
                data-highlighted={isHighlighted(learning.id, 'learning')}
              >
                <div className="item-text">{learning.text}</div>
                {learning.category && (
                  <div className="item-meta">Category: {learning.category}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accomplishments section */}
      {log.accomplishments.length > 0 && (
        <div className="log-section" data-testid="accomplishments-section">
          <h3 className="section-title">Accomplishments ({log.accomplishments.length})</h3>
          <div className="items-list">
            {log.accomplishments.map((accomplishment) => (
              <div
                key={`accomplishment-${accomplishment.id}`}
                ref={isHighlighted(accomplishment.id, 'accomplishment') ? highlightRef : null}
                className={`item ${isHighlighted(accomplishment.id, 'accomplishment') ? 'highlighted' : ''}`}
                data-testid={`accomplishment-item-${accomplishment.id}`}
                data-highlighted={isHighlighted(accomplishment.id, 'accomplishment')}
              >
                <div className="item-text">{accomplishment.text}</div>
                <div className="item-meta">Impact: {accomplishment.impact}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
