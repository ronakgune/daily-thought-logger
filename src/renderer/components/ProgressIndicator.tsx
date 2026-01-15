/**
 * ProgressIndicator Component
 * [AI-24] Show recording status and analysis progress
 *
 * Provides animated progress feedback for processing and analyzing states.
 */

import React from 'react';

/**
 * Props for ProgressIndicator component
 */
export interface ProgressIndicatorProps {
  /** Type of progress indicator */
  type: 'spinner' | 'dots' | 'bar';
  /** Optional progress percentage (0-100) for bar type */
  progress?: number;
  /** Size of the indicator */
  size?: 'sm' | 'md' | 'lg';
  /** Color theme */
  color?: 'blue' | 'purple' | 'yellow' | 'green' | 'red';
  /** Accessible label for screen readers */
  label?: string;
}

/**
 * Animated spinner indicator
 */
function Spinner({ size, color }: Pick<ProgressIndicatorProps, 'size' | 'color'>): JSX.Element {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  };

  const colorClasses = {
    blue: 'border-blue-600 border-t-transparent',
    purple: 'border-purple-600 border-t-transparent',
    yellow: 'border-yellow-600 border-t-transparent',
    green: 'border-green-600 border-t-transparent',
    red: 'border-red-600 border-t-transparent',
  };

  return (
    <div
      className={`
        ${sizeClasses[size || 'md']}
        ${colorClasses[color || 'blue']}
        rounded-full animate-spin
      `}
    />
  );
}

/**
 * Animated dots indicator
 */
function Dots({ size, color }: Pick<ProgressIndicatorProps, 'size' | 'color'>): JSX.Element {
  const sizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  const colorClasses = {
    blue: 'bg-blue-600',
    purple: 'bg-purple-600',
    yellow: 'bg-yellow-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
  };

  const dotClass = `${sizeClasses[size || 'md']} ${colorClasses[color || 'blue']} rounded-full`;

  return (
    <div className="flex gap-1.5">
      <div className={`${dotClass} animate-bounce`} style={{ animationDelay: '0ms' }} />
      <div className={`${dotClass} animate-bounce`} style={{ animationDelay: '150ms' }} />
      <div className={`${dotClass} animate-bounce`} style={{ animationDelay: '300ms' }} />
    </div>
  );
}

/**
 * Progress bar indicator
 */
function ProgressBar({
  progress = 0,
  size,
  color,
}: Pick<ProgressIndicatorProps, 'progress' | 'size' | 'color'>): JSX.Element {
  const heightClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const colorClasses = {
    blue: 'bg-blue-600',
    purple: 'bg-purple-600',
    yellow: 'bg-yellow-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
  };

  // Clamp progress between 0 and 100
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${heightClasses[size || 'md']}`}>
      <div
        className={`
          ${heightClasses[size || 'md']}
          ${colorClasses[color || 'blue']}
          transition-all duration-300 ease-out
        `}
        style={{ width: `${clampedProgress}%` }}
        role="progressbar"
        aria-valuenow={clampedProgress}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}

/**
 * ProgressIndicator Component
 *
 * Displays animated progress feedback in various styles (spinner, dots, bar).
 * Used to show that processing or analysis is in progress.
 */
export function ProgressIndicator({
  type,
  progress,
  size = 'md',
  color = 'blue',
  label = 'Loading',
}: ProgressIndicatorProps): JSX.Element {
  return (
    <div className="flex items-center justify-center" role="status" aria-label={label}>
      {type === 'spinner' && <Spinner size={size} color={color} />}
      {type === 'dots' && <Dots size={size} color={color} />}
      {type === 'bar' && <ProgressBar progress={progress} size={size} color={color} />}
      <span className="sr-only">{label}</span>
    </div>
  );
}
