import React from 'react';
import { TodoList } from './TodoList';
import { useTodos } from '../hooks/useTodos';

/**
 * TodoListDemo Component
 * AI-27: Demo component showing TodoList usage
 *
 * This component demonstrates how to use the TodoList component
 * with the useTodos hook for real data fetching via IPC.
 *
 * Usage in your app:
 * ```tsx
 * import { TodoListDemo } from './components/TodoListDemo';
 *
 * function App() {
 *   return <TodoListDemo />;
 * }
 * ```
 */
export const TodoListDemo: React.FC = () => {
  const { todos, loading, error, toggleComplete, viewLog, refresh } = useTodos();

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Daily Thought Logger - Todos</h1>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <TodoList
          todos={todos}
          loading={loading}
          error={error}
          onToggleComplete={toggleComplete}
          onViewLog={viewLog}
        />

        {/* Instructions for first-time users */}
        {!loading && todos.length === 0 && !error && (
          <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Getting Started
            </h3>
            <p className="text-blue-800 mb-4">
              To create todos, start recording your daily thoughts using the global
              shortcut or the recording interface. The AI will automatically extract
              and categorize action items from your recordings.
            </p>
            <ul className="list-disc list-inside text-blue-800 space-y-1">
              <li>High confidence todos (90%+) are very clear action items</li>
              <li>Priority is determined by urgency indicators in your speech</li>
              <li>Click on any todo to view its source log and full context</li>
              <li>Use filters to focus on active or completed items</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default TodoListDemo;
