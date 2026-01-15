import React, { useState, useEffect, useCallback } from 'react';
import type { Todo } from '@types/database';

/**
 * TodoList Component
 * AI-27: Build TodoList component with completion toggle
 *
 * Displays all todos from the database with the ability to:
 * - Toggle completion status
 * - Filter by completion status
 * - View priority indicators
 * - See confidence scores
 * - Click to view source log
 *
 * Features:
 * - List all todos from database
 * - Checkbox to mark complete
 * - Priority indicator (color/badge)
 * - Confidence score indicator
 * - Click to see source log
 * - Filter by completion status
 */

/**
 * Extended Todo type with confidence score from classification
 */
export interface TodoWithConfidence extends Todo {
  confidence?: number; // 0-1 confidence score from AI classification
  logDate?: string; // Date from the source log for context
}

/**
 * Props for TodoList component
 */
export interface TodoListProps {
  /**
   * Array of todos to display
   */
  todos: TodoWithConfidence[];

  /**
   * Callback when a todo's completion status is toggled
   */
  onToggleComplete?: (todoId: number, completed: boolean) => void;

  /**
   * Callback when clicking on a todo to view its source log
   */
  onViewLog?: (logId: number) => void;

  /**
   * Whether the component is in loading state
   */
  loading?: boolean;

  /**
   * Error message to display
   */
  error?: string | null;
}

/**
 * Filter options for todos
 */
type TodoFilter = 'all' | 'active' | 'completed';

/**
 * Get priority color class for visual indicator
 */
function getPriorityColor(priority: number): string {
  switch (priority) {
    case 1: // High priority
      return 'bg-red-500 text-white';
    case 2: // Medium priority
      return 'bg-yellow-500 text-white';
    case 3: // Low priority
      return 'bg-green-500 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
}

/**
 * Get priority label text
 */
function getPriorityLabel(priority: number): string {
  switch (priority) {
    case 1:
      return 'High';
    case 2:
      return 'Medium';
    case 3:
      return 'Low';
    default:
      return 'Unknown';
  }
}

/**
 * Get confidence color class based on score
 */
function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.9) {
    return 'text-green-600';
  } else if (confidence >= 0.7) {
    return 'text-blue-600';
  } else if (confidence >= 0.5) {
    return 'text-yellow-600';
  } else {
    return 'text-red-600';
  }
}

/**
 * Format confidence score as percentage
 */
function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
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
 * TodoList Component
 */
export const TodoList: React.FC<TodoListProps> = ({
  todos,
  onToggleComplete,
  onViewLog,
  loading = false,
  error = null,
}) => {
  const [filter, setFilter] = useState<TodoFilter>('all');

  // Filter todos based on selected filter
  const filteredTodos = todos.filter((todo) => {
    if (filter === 'active') {
      return !todo.completed;
    } else if (filter === 'completed') {
      return todo.completed;
    }
    return true; // 'all'
  });

  // Handle checkbox toggle
  const handleToggle = useCallback(
    (todoId: number, currentStatus: boolean) => {
      if (onToggleComplete) {
        onToggleComplete(todoId, !currentStatus);
      }
    },
    [onToggleComplete]
  );

  // Handle clicking on a todo to view its source log
  const handleViewLog = useCallback(
    (logId: number) => (event: React.MouseEvent) => {
      // Don't trigger if clicking on checkbox
      if ((event.target as HTMLElement).tagName === 'INPUT') {
        return;
      }
      if (onViewLog) {
        onViewLog(logId);
      }
    },
    [onViewLog]
  );

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
        <span className="ml-3 text-gray-600">Loading todos...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center">
          <span className="text-red-600 font-medium">Error:</span>
          <span className="ml-2 text-red-800">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header with filter buttons */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Todo List</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            aria-label="Show all todos"
          >
            All ({todos.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'active'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            aria-label="Show active todos"
          >
            Active ({todos.filter((t) => !t.completed).length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'completed'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            aria-label="Show completed todos"
          >
            Completed ({todos.filter((t) => t.completed).length})
          </button>
        </div>
      </div>

      {/* Todo list */}
      {filteredTodos.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">
            {filter === 'all'
              ? 'No todos yet. Start recording to create some!'
              : filter === 'active'
              ? 'No active todos. Great job!'
              : 'No completed todos yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTodos.map((todo) => (
            <div
              key={todo.id}
              className={`p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
                todo.completed ? 'border-gray-300 bg-gray-50' : 'border-gray-200'
              }`}
              onClick={handleViewLog(todo.logId)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleViewLog(todo.logId)(e as any);
                }
              }}
              aria-label={`Todo: ${todo.text}. Click to view source log.`}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => handleToggle(todo.id, todo.completed)}
                  className="mt-1 w-5 h-5 text-blue-500 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                  aria-label={`Mark todo as ${todo.completed ? 'incomplete' : 'complete'}`}
                  onClick={(e) => e.stopPropagation()}
                />

                {/* Todo content */}
                <div className="flex-1 min-w-0">
                  {/* Text and priority badge */}
                  <div className="flex items-start gap-2 mb-2">
                    <span
                      className={`text-gray-800 ${
                        todo.completed ? 'line-through text-gray-500' : ''
                      }`}
                    >
                      {todo.text}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(
                        todo.priority
                      )}`}
                    >
                      {getPriorityLabel(todo.priority)}
                    </span>
                  </div>

                  {/* Metadata row */}
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    {/* Confidence score */}
                    {todo.confidence !== undefined && (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">Confidence:</span>
                        <span
                          className={`font-semibold ${getConfidenceColor(
                            todo.confidence
                          )}`}
                        >
                          {formatConfidence(todo.confidence)}
                        </span>
                      </div>
                    )}

                    {/* Due date */}
                    {todo.dueDate && (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">Due:</span>
                        <span className="text-gray-700">
                          {formatDate(todo.dueDate)}
                        </span>
                      </div>
                    )}

                    {/* Log date */}
                    {todo.logDate && (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">From:</span>
                        <span className="text-gray-700">
                          {formatDate(todo.logDate)}
                        </span>
                      </div>
                    )}

                    {/* Source log link hint */}
                    <div className="ml-auto text-blue-500 text-xs">
                      Click to view source log
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary stats */}
      {filteredTodos.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {filteredTodos.length} of {todos.length} todos
            </span>
            <span>
              {todos.filter((t) => t.completed).length} completed,{' '}
              {todos.filter((t) => !t.completed).length} active
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TodoList;
