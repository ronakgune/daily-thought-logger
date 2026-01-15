/**
 * Components Index
 * [AI-24] Show recording status and analysis progress
 * [AI-32] Add item-to-log traceability links
 *
 * Exports all renderer components for easy importing.
 */

export { RecordingStatus } from './RecordingStatus';
export type { RecordingStatusProps, RecordingState } from './RecordingStatus';

export { ProgressIndicator } from './ProgressIndicator';
export type { ProgressIndicatorProps } from './ProgressIndicator';

export { RecordingDemo } from './RecordingDemo';

export { ItemWithSource } from './ItemWithSource';
export type { ItemWithSourceProps } from './ItemWithSource';

export { LogDetailView } from './LogDetailView';
export type { LogDetailViewProps } from './LogDetailView';

export { Breadcrumb } from './Breadcrumb';
export type { BreadcrumbProps, BreadcrumbItem } from './Breadcrumb';

export { TraceabilityDemo } from './TraceabilityDemo';
export type { TraceabilityDemoProps } from './TraceabilityDemo';
