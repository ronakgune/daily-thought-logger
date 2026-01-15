/**
 * App Component
 * AI-25: Main application component with layout and routing
 *
 * Root application component that:
 * - Integrates AppShell with Sidebar and main content
 * - Manages view state (dashboard, logs, todos, etc.)
 * - Provides navigation between views
 */

import React, { useState } from 'react';
import { AppShell } from './AppShell';
import { Sidebar, LogGroup, SidebarProps } from './Sidebar';
import { Dashboard } from './Dashboard';

export type ViewType = 'dashboard' | 'logs' | 'todos' | 'ideas' | 'learnings' | 'accomplishments';

export interface AppProps {
  initialView?: ViewType;
}

/**
 * App Component
 *
 * Main application component with full layout structure.
 */
export function App({ initialView = 'dashboard' }: AppProps): JSX.Element {
  const [currentView, setCurrentView] = useState<ViewType>(initialView);
  const [selectedLogId, setSelectedLogId] = useState<number | undefined>();

  // Mock data - will be replaced with real data from IPC/database
  const mockLogs: LogGroup[] = [
    {
      date: 'Today',
      logs: [
        {
          id: 1,
          time: '2:30 PM',
          preview: 'Had a great idea for improving the onboarding flow...',
        },
        {
          id: 2,
          time: '10:15 AM',
          preview: 'Finished the new feature implementation. Ready for review.',
        },
      ],
    },
    {
      date: 'Yesterday',
      logs: [
        {
          id: 3,
          time: '4:45 PM',
          preview: 'Meeting notes: discussed Q2 roadmap and priorities...',
        },
      ],
    },
  ];

  const mockStats = {
    totalLogs: 23,
    todayLogs: 2,
    pendingTodos: 5,
    totalIdeas: 12,
  };

  const mockRecentLogs = [
    {
      id: 1,
      date: 'Today at 2:30 PM',
      preview: 'Had a great idea for improving the onboarding flow. Users should see...',
    },
    {
      id: 2,
      date: 'Today at 10:15 AM',
      preview: 'Finished the new feature implementation. Ready for review.',
    },
    {
      id: 3,
      date: 'Yesterday at 4:45 PM',
      preview: 'Meeting notes: discussed Q2 roadmap and priorities.',
    },
  ];

  const handleNavigate = (view: SidebarProps['currentView']) => {
    if (view) {
      setCurrentView(view);
    }
  };

  const handleLogSelect = (logId: number) => {
    setSelectedLogId(logId);
    setCurrentView('logs');
  };

  const renderMainContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard stats={mockStats} recentLogs={mockRecentLogs} />;

      case 'logs':
        return (
          <div className="h-full p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Log History</h1>
            <p className="text-gray-600">View and search all your thought logs.</p>
            {selectedLogId && (
              <div className="mt-4 p-4 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-700">Selected log: {selectedLogId}</p>
              </div>
            )}
          </div>
        );

      case 'todos':
        return (
          <div className="h-full p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Todos</h1>
            <p className="text-gray-600">Manage your action items and tasks.</p>
          </div>
        );

      case 'ideas':
        return (
          <div className="h-full p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Ideas</h1>
            <p className="text-gray-600">Browse and develop your ideas.</p>
          </div>
        );

      case 'learnings':
        return (
          <div className="h-full p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Learnings</h1>
            <p className="text-gray-600">Review your insights and knowledge.</p>
          </div>
        );

      case 'accomplishments':
        return (
          <div className="h-full p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Accomplishments</h1>
            <p className="text-gray-600">Celebrate your achievements.</p>
          </div>
        );

      default:
        return <Dashboard stats={mockStats} recentLogs={mockRecentLogs} />;
    }
  };

  return (
    <AppShell
      sidebar={
        <Sidebar
          currentView={currentView}
          onNavigate={handleNavigate}
          logs={mockLogs}
          onLogSelect={handleLogSelect}
          selectedLogId={selectedLogId}
        />
      }
    >
      {renderMainContent()}
    </AppShell>
  );
}
