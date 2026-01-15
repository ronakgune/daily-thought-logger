/**
 * LearningsList Component - Usage Example
 * [AI-29] Build LearningsList component
 *
 * This example demonstrates how to use the LearningsList component
 * with sample data and common use cases.
 */

import React, { useState, useEffect } from 'react';
import { LearningsList } from './LearningsList';
import type { LearningWithLog } from './LearningsList';

/**
 * Example: Basic usage with static data
 */
export function BasicExample() {
  const sampleLearnings: LearningWithLog[] = [
    {
      id: 1,
      logId: 101,
      text: 'TypeScript generics provide type safety for reusable components',
      category: 'Programming',
      createdAt: '2024-01-15T10:00:00Z',
      logDate: '2024-01-15',
    },
    {
      id: 2,
      logId: 102,
      text: 'Regular breaks improve focus and productivity',
      category: 'Productivity',
      createdAt: '2024-01-16T14:30:00Z',
      logDate: '2024-01-16',
    },
    {
      id: 3,
      logId: 103,
      text: 'Database indexing significantly speeds up query performance',
      category: 'Database',
      createdAt: '2024-01-17T09:00:00Z',
      logDate: '2024-01-17',
    },
  ];

  const handleViewLog = (logId: number) => {
    console.log(`Viewing log ${logId}`);
    // Navigate to log detail view
    // window.location.href = `/logs/${logId}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">My Learnings</h1>
      <LearningsList learnings={sampleLearnings} onViewLog={handleViewLog} showFilter={true} />
    </div>
  );
}

/**
 * Example: Fetching learnings from a database service
 */
export function DatabaseExample() {
  const [learnings, setLearnings] = useState<LearningWithLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    fetchLearnings();
  }, []);

  const fetchLearnings = async () => {
    try {
      setIsLoading(true);
      setError(undefined);

      // In a real application, this would call your IPC handler
      // const result = await window.electron.ipcRenderer.invoke('database:getAllLearnings');

      // Simulated API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockData: LearningWithLog[] = [
        {
          id: 1,
          logId: 201,
          text: 'React hooks simplify state management in functional components',
          category: 'React',
          createdAt: '2024-01-20T10:00:00Z',
          logDate: '2024-01-20',
          logSummary: 'Daily standup notes and React learning',
        },
        {
          id: 2,
          logId: 202,
          text: 'Good sleep quality is essential for memory consolidation',
          category: 'Health',
          createdAt: '2024-01-21T08:30:00Z',
          logDate: '2024-01-21',
          logSummary: 'Morning reflection on sleep patterns',
        },
      ];

      setLearnings(mockData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load learnings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewLog = (logId: number) => {
    console.log(`Opening log ${logId}`);
    // Open log in a modal or navigate to detail view
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">My Learnings</h1>
        <button
          onClick={fetchLearnings}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      <LearningsList
        learnings={learnings}
        onViewLog={handleViewLog}
        isLoading={isLoading}
        error={error}
        showFilter={true}
      />
    </div>
  );
}

/**
 * Example: Integration with Electron IPC
 */
export function ElectronIPCExample() {
  const [learnings, setLearnings] = useState<LearningWithLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    loadLearningsFromDatabase();

    // Listen for database updates
    if (window.electron?.ipcRenderer) {
      const handleDatabaseUpdate = () => {
        loadLearningsFromDatabase();
      };

      // Subscribe to database change events
      window.electron.ipcRenderer.on('database:learnings-updated', handleDatabaseUpdate);

      return () => {
        window.electron.ipcRenderer.removeListener(
          'database:learnings-updated',
          handleDatabaseUpdate
        );
      };
    }
  }, []);

  const loadLearningsFromDatabase = async () => {
    try {
      setIsLoading(true);
      setError(undefined);

      // Call IPC handler to get learnings with log details
      // In a real implementation, you would add this IPC handler
      // const result = await window.electron.ipcRenderer.invoke('database:getAllLearningsWithLogs');

      // For now, simulate the call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock data - in production this would come from your DatabaseService
      const mockLearnings: LearningWithLog[] = [
        {
          id: 1,
          logId: 301,
          text: 'Electron IPC provides secure communication between main and renderer processes',
          category: 'Electron',
          createdAt: '2024-01-22T09:00:00Z',
          logDate: '2024-01-22',
          logSummary: 'Architecture review and IPC implementation',
        },
        {
          id: 2,
          logId: 302,
          text: 'SQLite indexes dramatically improve query performance on large datasets',
          category: 'Database',
          createdAt: '2024-01-23T11:30:00Z',
          logDate: '2024-01-23',
          logSummary: 'Database optimization work',
        },
      ];

      setLearnings(mockLearnings);
    } catch (err) {
      console.error('Failed to load learnings:', err);
      setError('Unable to load learnings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewLog = async (logId: number) => {
    try {
      // Open log detail in a new window or modal
      // await window.electron.ipcRenderer.invoke('window:openLogDetail', logId);
      console.log(`Opening log detail window for log ${logId}`);
    } catch (err) {
      console.error('Failed to open log:', err);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Learnings Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {learnings.length} {learnings.length === 1 ? 'learning' : 'learnings'}
            </span>
            <button
              onClick={loadLearningsFromDatabase}
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          <LearningsList
            learnings={learnings}
            onViewLog={handleViewLog}
            isLoading={isLoading}
            error={error}
            showFilter={true}
          />
        </div>
      </main>
    </div>
  );
}

/**
 * Example: Minimal usage without filters
 */
export function MinimalExample() {
  const learnings: LearningWithLog[] = [
    {
      id: 1,
      logId: 1,
      text: 'A simple learning without category',
      category: null,
      createdAt: new Date().toISOString(),
    },
  ];

  return <LearningsList learnings={learnings} showFilter={false} />;
}

/**
 * Example: Empty state
 */
export function EmptyStateExample() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">My Learnings</h1>
      <LearningsList learnings={[]} />
    </div>
  );
}

/**
 * Example: Error state
 */
export function ErrorStateExample() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">My Learnings</h1>
      <LearningsList learnings={[]} error="Failed to connect to database. Please check your connection." />
    </div>
  );
}

/**
 * Example: Loading state
 */
export function LoadingStateExample() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">My Learnings</h1>
      <LearningsList learnings={[]} isLoading={true} />
    </div>
  );
}
