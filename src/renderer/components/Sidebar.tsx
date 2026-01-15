/**
 * Sidebar Component
 * AI-25: Main window layout with sidebar navigation
 *
 * Left sidebar component with:
 * - Navigation menu
 * - Log history with date grouping
 * - Quick actions
 */

import React from 'react';

export interface SidebarProps {
  currentView?: 'dashboard' | 'logs' | 'todos' | 'ideas' | 'learnings' | 'accomplishments';
  onNavigate?: (view: SidebarProps['currentView']) => void;
  logs?: LogGroup[];
  onLogSelect?: (logId: number) => void;
  selectedLogId?: number;
}

export interface LogGroup {
  date: string; // ISO date or "Today", "Yesterday", etc.
  logs: LogItem[];
}

export interface LogItem {
  id: number;
  time: string; // e.g., "2:30 PM"
  preview: string; // First line of transcript
}

/**
 * Sidebar Component
 *
 * Displays navigation menu and log history organized by date.
 */
export function Sidebar({
  currentView = 'dashboard',
  onNavigate = () => {},
  logs = [],
  onLogSelect = () => {},
  selectedLogId,
}: SidebarProps): JSX.Element {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'logs', label: 'Log History', icon: '📝' },
    { id: 'todos', label: 'Todos', icon: '✅' },
    { id: 'ideas', label: 'Ideas', icon: '💡' },
    { id: 'learnings', label: 'Learnings', icon: '📚' },
    { id: 'accomplishments', label: 'Accomplishments', icon: '🎯' },
  ] as const;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Daily Thought Logger</h1>
        <p className="text-sm text-gray-600 mt-1">Capture your thoughts</p>
      </div>

      {/* Navigation */}
      <nav className="p-2 border-b border-gray-200">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onNavigate(item.id as SidebarProps['currentView'])}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium
                  transition-colors
                  ${
                    currentView === item.id
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Log History */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        <div className="space-y-4">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              No logs yet. Start recording!
            </div>
          ) : (
            logs.map((group) => (
              <div key={group.date}>
                {/* Date header */}
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {group.date}
                </div>

                {/* Logs for this date */}
                <ul className="space-y-1">
                  {group.logs.map((log) => (
                    <li key={log.id}>
                      <button
                        onClick={() => onLogSelect(log.id)}
                        className={`
                          w-full text-left px-3 py-2 rounded-md transition-colors
                          ${
                            selectedLogId === log.id
                              ? 'bg-primary-50 border-l-2 border-primary-500'
                              : 'hover:bg-gray-50'
                          }
                        `}
                      >
                        <div className="text-xs text-gray-500 mb-1">{log.time}</div>
                        <div className="text-sm text-gray-900 line-clamp-2">{log.preview}</div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer with quick actions */}
      <div className="p-4 border-t border-gray-200">
        <button
          className="
            w-full px-4 py-2 bg-primary-600 text-white rounded-md
            hover:bg-primary-700 transition-colors
            font-medium text-sm
          "
          onClick={() => {
            // This will be connected to the floating recorder later
            console.log('Open recorder');
          }}
        >
          + New Recording
        </button>
      </div>
    </div>
  );
}
