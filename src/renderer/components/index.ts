/**
 * Components Index
 * [AI-24] Show recording status and analysis progress
 * [AI-25] Main window layout components
 *
 * Exports all renderer components for easy importing.
 */

export { RecordingStatus } from './RecordingStatus';
export type { RecordingStatusProps, RecordingState } from './RecordingStatus';

export { ProgressIndicator } from './ProgressIndicator';
export type { ProgressIndicatorProps } from './ProgressIndicator';

export { RecordingDemo } from './RecordingDemo';

// AI-25: Main window layout components
export { AppShell } from './AppShell';
export type { AppShellProps } from './AppShell';

export { Sidebar } from './Sidebar';
export type { SidebarProps, LogGroup, LogItem } from './Sidebar';

export { Dashboard } from './Dashboard';
export type { DashboardProps } from './Dashboard';

export { App } from './App';
export type { AppProps, ViewType } from './App';
