/**
 * Dashboard Component
 * AI-25: Main dashboard view with widgets
 *
 * Main content area displaying overview widgets:
 * - Recent activity
 * - Quick stats
 * - Upcoming todos
 * - Recent ideas
 */

import React from 'react';

export interface DashboardProps {
  stats?: {
    totalLogs: number;
    todayLogs: number;
    pendingTodos: number;
    totalIdeas: number;
  };
  recentLogs?: Array<{
    id: number;
    date: string;
    preview: string;
  }>;
}

/**
 * Dashboard Component
 *
 * Main overview dashboard with widgets and stats.
 */
export function Dashboard({ stats, recentLogs = [] }: DashboardProps): JSX.Element {
  const defaultStats = {
    totalLogs: 0,
    todayLogs: 0,
    pendingTodos: 0,
    totalIdeas: 0,
    ...stats,
  };

  const statCards = [
    { label: 'Total Logs', value: defaultStats.totalLogs, icon: '📝', color: 'blue' },
    { label: 'Today', value: defaultStats.todayLogs, icon: '📅', color: 'green' },
    { label: 'Pending Todos', value: defaultStats.pendingTodos, icon: '✅', color: 'yellow' },
    { label: 'Ideas', value: defaultStats.totalIdeas, icon: '💡', color: 'purple' },
  ];

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    purple: 'bg-purple-50 text-purple-700',
  };

  return (
    <div className="h-full p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's your overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`text-4xl ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <div className="p-6">
          {recentLogs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎤</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No logs yet</h3>
              <p className="text-gray-600 mb-4">
                Start by recording your first thought using the "New Recording" button.
              </p>
              <div className="text-sm text-gray-500">
                Press <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-300 font-mono">
                  Cmd+Shift+Space
                </kbd> to open the recorder
              </div>
            </div>
          ) : (
            <ul className="space-y-3">
              {recentLogs.map((log) => (
                <li
                  key={log.id}
                  className="p-4 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{log.preview}</p>
                      <p className="text-xs text-gray-500 mt-1">{log.date}</p>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
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
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <button className="w-full text-left px-4 py-3 rounded-md bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors">
              📝 View All Logs
            </button>
            <button className="w-full text-left px-4 py-3 rounded-md bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors">
              ✅ Manage Todos
            </button>
            <button className="w-full text-left px-4 py-3 rounded-md bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors">
              💡 Browse Ideas
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Getting Started</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Use Cmd+Shift+Space to open recorder</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Speak your thoughts naturally</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>AI will automatically organize everything</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Review and manage in the sidebar</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
