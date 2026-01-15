/**
 * TraceabilityDemo Component
 * AI-32: Add item-to-log traceability links
 *
 * Demo component showing how to use the traceability components together.
 * This demonstrates the complete flow from item view → log detail view with highlighting.
 */

import React, { useState } from 'react';
import { ItemWithSource } from './ItemWithSource';
import { LogDetailView } from './LogDetailView';
import { Breadcrumb } from './Breadcrumb';
import type { LogWithSegments, Todo, Idea, Learning, Accomplishment } from '../../types/database';
import type { BreadcrumbItem } from './Breadcrumb';

export interface TraceabilityDemoProps {
  /** Sample data for demonstration */
  sampleLog?: LogWithSegments;
}

/**
 * TraceabilityDemo shows the complete traceability workflow.
 *
 * Flow:
 * 1. Show a list of items with source information
 * 2. Click "View Source" to navigate to log detail
 * 3. Log detail view highlights the selected item
 * 4. Breadcrumb navigation allows going back
 */
export const TraceabilityDemo: React.FC<TraceabilityDemoProps> = ({ sampleLog }) => {
  const [currentView, setCurrentView] = useState<'list' | 'detail'>('list');
  const [highlightItemId, setHighlightItemId] = useState<number | undefined>();
  const [highlightItemType, setHighlightItemType] = useState<
    'todo' | 'idea' | 'learning' | 'accomplishment' | undefined
  >();

  // Sample data if none provided
  const defaultLog: LogWithSegments = sampleLog || {
    id: 1,
    date: '2024-01-15',
    audioPath: '/path/to/audio.wav',
    transcript: 'Today I completed the traceability feature and learned about React component design.',
    summary: 'Completed traceability implementation and gained insights on React patterns.',
    pendingAnalysis: false,
    retryCount: 0,
    lastError: null,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    todos: [
      {
        id: 1,
        logId: 1,
        text: 'Write comprehensive tests',
        completed: false,
        dueDate: null,
        priority: 1,
        createdAt: '2024-01-15T10:31:00Z',
        updatedAt: '2024-01-15T10:31:00Z',
      },
      {
        id: 2,
        logId: 1,
        text: 'Review code with team',
        completed: false,
        dueDate: '2024-01-20',
        priority: 2,
        createdAt: '2024-01-15T10:32:00Z',
        updatedAt: '2024-01-15T10:32:00Z',
      },
    ],
    ideas: [
      {
        id: 3,
        logId: 1,
        text: 'Add keyboard shortcuts for navigation',
        status: 'raw',
        tags: null,
        createdAt: '2024-01-15T10:33:00Z',
        updatedAt: '2024-01-15T10:33:00Z',
      },
    ],
    learnings: [
      {
        id: 4,
        logId: 1,
        text: 'React component composition enables powerful UI patterns',
        category: 'react',
        createdAt: '2024-01-15T10:34:00Z',
      },
    ],
    accomplishments: [
      {
        id: 5,
        logId: 1,
        text: 'Completed traceability feature implementation',
        impact: 'high',
        createdAt: '2024-01-15T10:35:00Z',
      },
    ],
  };

  const log = sampleLog || defaultLog;

  /**
   * Handle viewing source log for an item
   */
  const handleViewSource = (
    logId: number,
    itemId: number,
    itemType: 'todo' | 'idea' | 'learning' | 'accomplishment'
  ) => {
    setHighlightItemId(itemId);
    setHighlightItemType(itemType);
    setCurrentView('detail');
  };

  /**
   * Handle back navigation from log detail
   */
  const handleBack = () => {
    setCurrentView('list');
    setHighlightItemId(undefined);
    setHighlightItemType(undefined);
  };

  /**
   * Generate breadcrumb items based on current view
   */
  const getBreadcrumbItems = (): BreadcrumbItem[] => {
    if (currentView === 'list') {
      return [
        { label: 'Home', onClick: () => setCurrentView('list') },
        { label: 'All Items', isActive: true },
      ];
    } else {
      return [
        { label: 'Home', onClick: handleBack },
        { label: 'All Items', onClick: handleBack },
        { label: 'Log Detail', isActive: true },
      ];
    }
  };

  /**
   * Get item type from item properties
   */
  const getItemType = (
    item: Todo | Idea | Learning | Accomplishment
  ): 'todo' | 'idea' | 'learning' | 'accomplishment' => {
    if ('completed' in item && 'priority' in item) return 'todo';
    if ('status' in item && 'tags' in item) return 'idea';
    if ('category' in item && !('impact' in item)) return 'learning';
    return 'accomplishment';
  };

  return (
    <div className="traceability-demo" data-testid="traceability-demo">
      <Breadcrumb items={getBreadcrumbItems()} />

      {currentView === 'list' ? (
        <div className="items-list-view" data-testid="items-list-view">
          <h2>All Extracted Items</h2>
          <p>Click "View Source" to see the log where each item was extracted.</p>

          <div className="items-section">
            <h3>Todos</h3>
            {log.todos.map((todo) => (
              <ItemWithSource
                key={`todo-${todo.id}`}
                item={todo}
                sourceLog={log}
                onViewSource={(logId, itemId) => handleViewSource(logId, itemId, 'todo')}
              />
            ))}
          </div>

          <div className="items-section">
            <h3>Ideas</h3>
            {log.ideas.map((idea) => (
              <ItemWithSource
                key={`idea-${idea.id}`}
                item={idea}
                sourceLog={log}
                onViewSource={(logId, itemId) => handleViewSource(logId, itemId, 'idea')}
              />
            ))}
          </div>

          <div className="items-section">
            <h3>Learnings</h3>
            {log.learnings.map((learning) => (
              <ItemWithSource
                key={`learning-${learning.id}`}
                item={learning}
                sourceLog={log}
                onViewSource={(logId, itemId) => handleViewSource(logId, itemId, 'learning')}
              />
            ))}
          </div>

          <div className="items-section">
            <h3>Accomplishments</h3>
            {log.accomplishments.map((accomplishment) => (
              <ItemWithSource
                key={`accomplishment-${accomplishment.id}`}
                item={accomplishment}
                sourceLog={log}
                onViewSource={(logId, itemId) =>
                  handleViewSource(logId, itemId, 'accomplishment')
                }
              />
            ))}
          </div>
        </div>
      ) : (
        <LogDetailView
          log={log}
          highlightItemId={highlightItemId}
          highlightItemType={highlightItemType}
          onBack={handleBack}
        />
      )}
    </div>
  );
};
