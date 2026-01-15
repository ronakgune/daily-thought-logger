/**
 * useTodos Hook
 * AI-27: React hook for TodoList component data management
 *
 * Provides a clean interface for fetching and managing todos via IPC.
 */

import { useState, useEffect, useCallback } from 'react';
import type { Todo, TodoQueryOptions } from '@types/database';
import type { TodoWithConfidence } from '../components/TodoList';
import type { ClassifiedSegment } from '../../prompts/classification';

/**
 * Get the Electron API for IPC communication
 */
function getElectronAPI() {
  if (typeof window === 'undefined' || !('electron' in window)) {
    throw new Error('Electron API not found. Make sure preload script is loaded.');
  }
  return (window as any).electron;
}

/**
 * Check if Electron API is available
 */
function hasElectronAPI(): boolean {
  return typeof window !== 'undefined' && 'electron' in window;
}

/**
 * Map of confidence scores by todo ID
 * In a real implementation, this would be stored with the todo or fetched separately
 */
const confidenceScores = new Map<number, number>();

/**
 * Store confidence score for a todo
 */
export function setTodoConfidence(todoId: number, confidence: number): void {
  confidenceScores.set(todoId, confidence);
}

/**
 * Hook for managing todos with IPC communication
 *
 * @param options - Query options for filtering todos
 * @returns Todo state and management functions
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { todos, loading, error, refresh, toggleComplete, viewLog } = useTodos();
 *
 *   return (
 *     <TodoList
 *       todos={todos}
 *       loading={loading}
 *       error={error}
 *       onToggleComplete={toggleComplete}
 *       onViewLog={viewLog}
 *     />
 *   );
 * }
 * ```
 */
export function useTodos(options?: TodoQueryOptions) {
  const [todos, setTodos] = useState<TodoWithConfidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch todos from the database via IPC
   */
  const fetchTodos = useCallback(async () => {
    if (!hasElectronAPI()) {
      setError('Electron API not available');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const api = getElectronAPI();
      const result = await api.invoke('todos:getAll', options);

      // Enhance todos with confidence scores
      const todosWithConfidence: TodoWithConfidence[] = result.map((todo: Todo) => ({
        ...todo,
        confidence: confidenceScores.get(todo.id),
      }));

      setTodos(todosWithConfidence);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch todos';
      setError(message);
      console.error('Failed to fetch todos:', err);
    } finally {
      setLoading(false);
    }
  }, [options]);

  /**
   * Toggle the completion status of a todo
   */
  const toggleComplete = useCallback(async (todoId: number, completed: boolean) => {
    if (!hasElectronAPI()) {
      setError('Electron API not available');
      return;
    }

    try {
      const api = getElectronAPI();
      await api.invoke('todos:toggleComplete', { todoId, completed });

      // Optimistically update the local state
      setTodos((prev) =>
        prev.map((todo) =>
          todo.id === todoId ? { ...todo, completed } : todo
        )
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update todo';
      setError(message);
      console.error('Failed to toggle todo:', err);
      // Refresh to get the correct state
      fetchTodos();
    }
  }, [fetchTodos]);

  /**
   * View the source log for a todo
   */
  const viewLog = useCallback(async (logId: number) => {
    if (!hasElectronAPI()) {
      setError('Electron API not available');
      return;
    }

    try {
      const api = getElectronAPI();
      const log = await api.invoke('todos:getLog', { logId });

      // In a real app, this would navigate to a log detail view
      // For now, just log it
      console.log('Source log:', log);

      // You could emit a custom event or use a router here
      if (window.dispatchEvent) {
        window.dispatchEvent(
          new CustomEvent('view-log', { detail: { logId, log } })
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch log';
      setError(message);
      console.error('Failed to view log:', err);
    }
  }, []);

  /**
   * Refresh the todo list
   */
  const refresh = useCallback(() => {
    fetchTodos();
  }, [fetchTodos]);

  // Fetch todos on mount and when options change
  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  // Listen for analysis complete events to refresh
  useEffect(() => {
    if (!hasElectronAPI()) {
      return;
    }

    const api = getElectronAPI();

    // Set up listener for analysis complete
    const handleAnalysisComplete = () => {
      fetchTodos();
    };

    // In a real implementation, this would use the proper event listener
    // For now, this is a placeholder
    if (api.on) {
      api.on('analyze:complete', handleAnalysisComplete);
    }

    return () => {
      if (api.removeListener) {
        api.removeListener('analyze:complete', handleAnalysisComplete);
      }
    };
  }, [fetchTodos]);

  return {
    todos,
    loading,
    error,
    refresh,
    toggleComplete,
    viewLog,
  };
}

/**
 * Hook result interface for type safety
 */
export interface UseTodosResult {
  todos: TodoWithConfidence[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  toggleComplete: (todoId: number, completed: boolean) => Promise<void>;
  viewLog: (logId: number) => Promise<void>;
}
