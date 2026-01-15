/**
 * IdeasList Component Usage Example
 * [AI-28] Build IdeasList component with status management
 *
 * This example demonstrates how to integrate the IdeasList component
 * with the IPC client for fetching and updating ideas.
 */

import React, { useState, useEffect } from 'react';
import { IdeasList } from './IdeasList';
import { IPCClient } from '../ipc-client';
import type { Idea, IdeaStatus } from '../../types/database';

/**
 * Example container component that manages idea state
 */
export function IdeasListContainer(): JSX.Element {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [ipcClient] = useState(() => new IPCClient());

  // Load ideas on mount
  useEffect(() => {
    loadIdeas();

    // Cleanup IPC client on unmount
    return () => {
      ipcClient.cleanup();
    };
  }, []);

  /**
   * Load all ideas from database
   */
  const loadIdeas = async () => {
    try {
      setLoading(true);
      setError(undefined);
      const allIdeas = await ipcClient.getAllIdeas();
      setIdeas(allIdeas);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ideas');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle status change for an idea
   */
  const handleStatusChange = async (ideaId: number, newStatus: IdeaStatus) => {
    try {
      // Optimistically update UI
      setIdeas((prev) =>
        prev.map((idea) =>
          idea.id === ideaId ? { ...idea, status: newStatus } : idea
        )
      );

      // Update in database
      await ipcClient.updateIdeaStatus(ideaId, newStatus);
    } catch (err) {
      // Revert on error
      setError('Failed to update idea status');
      await loadIdeas(); // Reload to get correct state
    }
  };

  /**
   * Handle viewing source log
   */
  const handleViewLog = (logId: number) => {
    // Navigate to log details or open log viewer
    console.log(`Viewing log ${logId}`);
    // In a real app, you might:
    // - Navigate to a log details page
    // - Open a modal with log details
    // - Scroll to the log in a list
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <IdeasList
        ideas={ideas}
        onStatusChange={handleStatusChange}
        onViewLog={handleViewLog}
        loading={loading}
        error={error}
        onRetry={loadIdeas}
      />
    </div>
  );
}

/**
 * Example with filtering by status
 */
export function FilteredIdeasListExample(): JSX.Element {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [ipcClient] = useState(() => new IPCClient());

  // Load only ideas with 'developing' status
  useEffect(() => {
    const loadDevelopingIdeas = async () => {
      const filteredIdeas = await ipcClient.getAllIdeas({ status: 'developing' });
      setIdeas(filteredIdeas);
    };

    loadDevelopingIdeas();

    return () => {
      ipcClient.cleanup();
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Ideas In Progress</h1>
      <IdeasList ideas={ideas} />
    </div>
  );
}

/**
 * Example with custom handlers
 */
export function CustomHandlersExample(): JSX.Element {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [ipcClient] = useState(() => new IPCClient());

  useEffect(() => {
    loadIdeas();

    // Listen for new analysis results
    const cleanup = ipcClient.onComplete(async () => {
      // Reload ideas when new analysis completes
      await loadIdeas();
    });

    return () => {
      cleanup();
      ipcClient.cleanup();
    };
  }, []);

  const loadIdeas = async () => {
    const allIdeas = await ipcClient.getAllIdeas();
    setIdeas(allIdeas);
  };

  const handleStatusChange = async (ideaId: number, newStatus: IdeaStatus) => {
    await ipcClient.updateIdeaStatus(ideaId, newStatus);

    // Update local state
    setIdeas((prev) =>
      prev.map((idea) =>
        idea.id === ideaId ? { ...idea, status: newStatus } : idea
      )
    );

    // Show notification
    console.log(`Idea ${ideaId} marked as ${newStatus}`);
  };

  const handleViewLog = (logId: number) => {
    // Custom navigation logic
    window.location.hash = `#/logs/${logId}`;
  };

  return <IdeasList ideas={ideas} onStatusChange={handleStatusChange} onViewLog={handleViewLog} />;
}

/**
 * Example showing read-only mode (no status changes)
 */
export function ReadOnlyIdeasList(): JSX.Element {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [ipcClient] = useState(() => new IPCClient());

  useEffect(() => {
    const loadIdeas = async () => {
      const allIdeas = await ipcClient.getAllIdeas();
      setIdeas(allIdeas);
    };

    loadIdeas();

    return () => {
      ipcClient.cleanup();
    };
  }, []);

  // No onStatusChange handler - dropdowns will be disabled
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">All Ideas (Read-Only)</h1>
      <IdeasList ideas={ideas} />
    </div>
  );
}
