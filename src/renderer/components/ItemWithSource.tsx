/**
 * ItemWithSource Component
 * AI-32: Add item-to-log traceability links
 *
 * Displays an item (todo, idea, learning, accomplishment) with a link to its source log.
 * Shows the source log timestamp and provides a "View Source" button.
 */

import React from 'react';
import type {
  Todo,
  Idea,
  Learning,
  Accomplishment,
  Log,
} from '../../types/database';

export interface ItemWithSourceProps {
  /** The item to display (can be any extracted item type) */
  item: Todo | Idea | Learning | Accomplishment;
  /** The source log information */
  sourceLog: Log;
  /** Callback when "View Source" is clicked */
  onViewSource: (logId: number, itemId: number) => void;
  /** Optional CSS class for styling */
  className?: string;
}

/**
 * Formats a timestamp string to a readable date/time format
 */
function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Determines the item type for display
 */
function getItemType(item: Todo | Idea | Learning | Accomplishment): string {
  if ('completed' in item && 'priority' in item) return 'Todo';
  if ('status' in item && 'tags' in item) return 'Idea';
  if ('category' in item && !('impact' in item)) return 'Learning';
  if ('impact' in item) return 'Accomplishment';
  return 'Item';
}

/**
 * ItemWithSource displays an extracted item with traceability to its source log.
 *
 * Features:
 * - Shows the item text
 * - Displays source log timestamp
 * - Provides "View Source" link
 * - Supports all item types (todos, ideas, learnings, accomplishments)
 */
export const ItemWithSource: React.FC<ItemWithSourceProps> = ({
  item,
  sourceLog,
  onViewSource,
  className = '',
}) => {
  const itemType = getItemType(item);

  const handleViewSource = (e: React.MouseEvent) => {
    e.preventDefault();
    onViewSource(item.logId, item.id);
  };

  return (
    <div className={`item-with-source ${className}`} data-testid="item-with-source">
      <div className="item-content">
        <div className="item-type" data-testid="item-type">
          {itemType}
        </div>
        <div className="item-text" data-testid="item-text">
          {item.text}
        </div>
      </div>
      <div className="item-source" data-testid="item-source">
        <span className="source-timestamp" data-testid="source-timestamp">
          From log: {formatTimestamp(sourceLog.createdAt)}
        </span>
        <button
          className="view-source-button"
          onClick={handleViewSource}
          data-testid="view-source-button"
          aria-label={`View source log for ${itemType.toLowerCase()}`}
        >
          View Source
        </button>
      </div>
    </div>
  );
};
