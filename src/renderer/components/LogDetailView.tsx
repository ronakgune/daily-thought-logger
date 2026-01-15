/**
 * LogDetailView Component
 * AI-31: Implement LogDetailView
 *
 * Displays full log details including transcript, audio playback, and all extracted items.
 */

import React, { useMemo } from 'react';
import type { LogWithSegments } from '../../types/database';

export interface LogDetailViewProps {
  /** The log with all its segments to display */
  log: LogWithSegments;
  /** Callback when user clicks back button */
  onBack?: () => void;
  /** Callback when audio play button is clicked */
  onPlayAudio?: (audioPath: string) => void;
}

/**
 * LogDetailView displays a complete log entry with transcript and all extracted items.
 *
 * Features:
 * - Header with date, time, and audio playback
 * - Full transcript display
 * - Extracted items grouped by type (todos, ideas, learnings, accomplishments)
 * - Navigation back to list
 * - Responsive layout with proper spacing
 *
 * @example
 * ```tsx
 * <LogDetailView
 *   log={logWithSegments}
 *   onBack={() => navigate('/logs')}
 *   onPlayAudio={(path) => audioPlayer.play(path)}
 * />
 * ```
 */
export const LogDetailView: React.FC<LogDetailViewProps> = ({
  log,
  onBack,
  onPlayAudio,
}) => {
  // Format date and time from ISO string
  const { formattedDate, formattedTime } = useMemo(() => {
    const date = new Date(log.date);
    return {
      formattedDate: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      formattedTime: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  }, [log.date]);

  // Calculate duration if available (future enhancement)
  const duration = useMemo(() => {
    // Duration would come from audio metadata in a future implementation
    return null;
  }, []);

  // Check if audio is available
  const hasAudio = Boolean(log.audioPath);

  // Handle play audio click
  const handlePlayAudio = () => {
    if (hasAudio && log.audioPath && onPlayAudio) {
      onPlayAudio(log.audioPath);
    }
  };

  // Count items by type
  const itemCounts = useMemo(() => ({
    todos: log.todos.length,
    ideas: log.ideas.length,
    learnings: log.learnings.length,
    accomplishments: log.accomplishments.length,
  }), [log]);

  const totalItems = itemCounts.todos + itemCounts.ideas + itemCounts.learnings + itemCounts.accomplishments;

  return (
    <div className="w-full h-full bg-gray-50 overflow-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
            aria-label="Go back to log list"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="font-medium">Back to Logs</span>
          </button>
        )}

        {/* Header Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {formattedDate}
              </h1>
              <div className="flex items-center gap-4 text-gray-600">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{formattedTime}</span>
                </div>
                {duration && (
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.75 5.25v13.5m-7.5-13.5v13.5"
                      />
                    </svg>
                    <span>{duration}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                  <span>{totalItems} {totalItems === 1 ? 'item' : 'items'} extracted</span>
                </div>
              </div>
            </div>

            {/* Audio Play Button */}
            {hasAudio && (
              <button
                onClick={handlePlayAudio}
                disabled={!onPlayAudio}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Play audio recording"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span className="font-medium">Play Audio</span>
              </button>
            )}
          </div>
        </div>

        {/* Transcript Section */}
        {log.transcript && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Transcript
            </h2>
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {log.transcript}
              </p>
            </div>
          </div>
        )}

        {/* Extracted Items Section */}
        {totalItems > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
              Extracted Items
            </h2>

            <div className="space-y-6">
              {/* Todos */}
              {itemCounts.todos > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    Todos ({itemCounts.todos})
                  </h3>
                  <ul className="space-y-2">
                    {log.todos.map((todo) => (
                      <li
                        key={todo.id}
                        className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200"
                      >
                        <input
                          type="checkbox"
                          checked={todo.completed}
                          readOnly
                          className="mt-1 w-4 h-4 text-red-500 rounded focus:ring-red-500"
                          aria-label={`Todo: ${todo.text}`}
                        />
                        <div className="flex-1">
                          <p className={`text-gray-800 ${todo.completed ? 'line-through text-gray-500' : ''}`}>
                            {todo.text}
                          </p>
                          {todo.dueDate && (
                            <p className="text-sm text-gray-600 mt-1">
                              Due: {new Date(todo.dueDate).toLocaleDateString()}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                todo.priority === 1
                                  ? 'bg-red-100 text-red-700'
                                  : todo.priority === 2
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {todo.priority === 1 ? 'High' : todo.priority === 2 ? 'Medium' : 'Low'} Priority
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Ideas */}
              {itemCounts.ideas > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    Ideas ({itemCounts.ideas})
                  </h3>
                  <ul className="space-y-2">
                    {log.ideas.map((idea) => (
                      <li
                        key={idea.id}
                        className="p-3 bg-purple-50 rounded-lg border border-purple-200"
                      >
                        <p className="text-gray-800">{idea.text}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700">
                            {idea.status}
                          </span>
                          {idea.tags && JSON.parse(idea.tags).length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {JSON.parse(idea.tags).map((tag: string, index: number) => (
                                <span
                                  key={index}
                                  className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Learnings */}
              {itemCounts.learnings > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    Learnings ({itemCounts.learnings})
                  </h3>
                  <ul className="space-y-2">
                    {log.learnings.map((learning) => (
                      <li
                        key={learning.id}
                        className="p-3 bg-blue-50 rounded-lg border border-blue-200"
                      >
                        <p className="text-gray-800">{learning.text}</p>
                        {learning.category && (
                          <span className="inline-block mt-2 text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                            {learning.category}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Accomplishments */}
              {itemCounts.accomplishments > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    Accomplishments ({itemCounts.accomplishments})
                  </h3>
                  <ul className="space-y-2">
                    {log.accomplishments.map((accomplishment) => (
                      <li
                        key={accomplishment.id}
                        className="p-3 bg-green-50 rounded-lg border border-green-200"
                      >
                        <p className="text-gray-800">{accomplishment.text}</p>
                        <span
                          className={`inline-block mt-2 text-xs px-2 py-1 rounded ${
                            accomplishment.impact === 'high'
                              ? 'bg-green-100 text-green-700'
                              : accomplishment.impact === 'medium'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {accomplishment.impact} impact
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {totalItems === 0 && !log.transcript && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No Content Available
            </h3>
            <p className="text-gray-500">
              This log has no transcript or extracted items yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
