/**
 * AppShell Component
 * AI-25: Main window layout with sidebar + main area
 *
 * Root layout component that provides the overall structure:
 * - Left sidebar for navigation and log history
 * - Main content area for dashboard/views
 * - Responsive design with Tailwind CSS
 */

import React, { ReactNode } from 'react';

export interface AppShellProps {
  sidebar: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * AppShell Component
 *
 * Provides a two-column layout with sidebar and main content area.
 * The sidebar has a fixed width and the main area is flexible.
 *
 * @param sidebar - Content to display in the sidebar (typically navigation)
 * @param children - Main content area
 * @param className - Optional additional CSS classes
 */
export function AppShell({ sidebar, children, className = '' }: AppShellProps): JSX.Element {
  return (
    <div className={`flex h-full w-full overflow-hidden ${className}`}>
      {/* Sidebar - fixed width, scrollable */}
      <aside className="w-sidebar flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto custom-scrollbar">
        {sidebar}
      </aside>

      {/* Main content area - flexible width, scrollable */}
      <main className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50">
        {children}
      </main>
    </div>
  );
}
