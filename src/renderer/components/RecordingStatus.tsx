/**
 * RecordingStatus Component
 * [AI-24] Show recording status and analysis progress
 *
 * Provides visual feedback throughout the recording and analysis process with
 * distinct states, real-time updates, and accessibility support.
 */

import React from 'react';
import { ProgressIndicator } from './ProgressIndicator';

/**
 * Recording and analysis status states
 */
export type RecordingState =
  | 'ready'      // Ready to record
  | 'recording'  // Currently recording
  | 'processing' // Processing audio
  | 'analyzing'  // Analyzing content
  | 'complete'   // Analysis complete
  | 'error';     // Error occurred

/**
 * Props for RecordingStatus component
 */
export interface RecordingStatusProps {
  /** Current state of the recording/analysis process */
  state: RecordingState;
  /** Recording duration in seconds (only relevant when recording) */
  duration?: number;
  /** Error message if state is 'error' */
  errorMessage?: string;
  /** Analysis progress percentage (0-100) when analyzing */
  progress?: number;
  /** Callback when user clicks retry (only shown in error state) */
  onRetry?: () => void;
  /** Callback when user dismisses success message */
  onDismiss?: () => void;
}

/**
 * Formats seconds into MM:SS format
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * RecordingStatus Component
 *
 * Displays the current state of recording and analysis with appropriate
 * visual feedback, icons, and actions.
 */
export function RecordingStatus({
  state,
  duration = 0,
  errorMessage,
  progress,
  onRetry,
  onDismiss,
}: RecordingStatusProps): JSX.Element {
  // State-specific configurations
  const stateConfig = {
    ready: {
      icon: '🎤',
      title: 'Ready to Record',
      message: 'Press the button or use the shortcut to start',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    recording: {
      icon: '🔴',
      title: 'Recording',
      message: duration ? formatDuration(duration) : '00:00',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      pulse: true,
    },
    processing: {
      icon: '⚙️',
      title: 'Processing Audio',
      message: 'Converting your recording...',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      spinner: true,
    },
    analyzing: {
      icon: '🧠',
      title: 'Analyzing Content',
      message: progress !== undefined ? `${Math.round(progress)}% complete` : 'Extracting insights...',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      spinner: true,
      showProgress: progress !== undefined,
    },
    complete: {
      icon: '✓',
      title: 'Complete',
      message: 'Successfully processed your recording',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    error: {
      icon: '⚠️',
      title: 'Error',
      message: errorMessage || 'Something went wrong',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
    },
  };

  const config = stateConfig[state];

  // Auto-dismiss complete state after 2 seconds
  React.useEffect(() => {
    if (state === 'complete' && onDismiss) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [state, onDismiss]);

  return (
    <div
      className={`
        px-4 py-3 rounded-lg border-2
        ${config.bgColor} ${config.borderColor}
        transition-all duration-300 ease-in-out
        ${config.pulse ? 'animate-pulse' : ''}
      `}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Main content row */}
      <div className="flex items-center justify-between">
        {/* Left section: Icon and text */}
        <div className="flex items-center gap-3">
          {/* Icon with optional spinner */}
          <div className="relative">
            <span className="text-2xl" aria-hidden="true">
              {config.icon}
            </span>
            {config.spinner && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Text content */}
          <div className="flex flex-col">
            <span className={`font-semibold ${config.color}`}>
              {config.title}
            </span>
            <span className="text-sm text-gray-600">
              {config.message}
            </span>
          </div>
        </div>

        {/* Right section: Actions */}
        <div className="flex items-center gap-2">
          {/* Retry button for error state */}
          {state === 'error' && onRetry && (
            <button
              onClick={onRetry}
              className="
                px-3 py-1 text-sm font-medium
                text-white bg-red-600 hover:bg-red-700
                rounded-md transition-colors
                focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
              "
              aria-label="Retry recording"
            >
              Retry
            </button>
          )}

          {/* Dismiss button for complete state */}
          {state === 'complete' && onDismiss && (
            <button
              onClick={onDismiss}
              className="
                text-gray-400 hover:text-gray-600
                transition-colors
                focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 rounded
              "
              aria-label="Dismiss notification"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Progress bar for analyzing state */}
      {state === 'analyzing' && config.showProgress && progress !== undefined && (
        <div className="mt-3">
          <ProgressIndicator
            type="bar"
            progress={progress}
            size="sm"
            color="purple"
            label={`Analysis ${Math.round(progress)}% complete`}
          />
        </div>
      )}

      {/* Screen reader announcements */}
      <span className="sr-only">
        {state === 'recording' && `Recording for ${formatDuration(duration)}`}
        {state === 'processing' && 'Processing your audio recording'}
        {state === 'analyzing' && (progress !== undefined ? `Analyzing your content, ${Math.round(progress)}% complete` : 'Analyzing your content')}
        {state === 'complete' && 'Recording successfully processed'}
        {state === 'error' && `Error: ${errorMessage || 'Something went wrong'}`}
      </span>
    </div>
  );
}
