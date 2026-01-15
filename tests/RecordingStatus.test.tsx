/**
 * Tests for RecordingStatus Component
 * [AI-24] Show recording status and analysis progress
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RecordingStatus } from '../src/renderer/components/RecordingStatus';
import type { RecordingState } from '../src/renderer/components/RecordingStatus';

describe('RecordingStatus', () => {
  describe('Ready State', () => {
    it('should render ready state correctly', () => {
      render(<RecordingStatus state="ready" />);

      expect(screen.getByText('Ready to Record')).toBeInTheDocument();
      expect(screen.getByText('Press the button or use the shortcut to start')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveClass('bg-blue-50', 'border-blue-200');
    });

    it('should have accessible status announcement', () => {
      render(<RecordingStatus state="ready" />);
      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-live', 'polite');
      expect(status).toHaveAttribute('aria-atomic', 'true');
    });
  });

  describe('Recording State', () => {
    it('should render recording state with timer', () => {
      render(<RecordingStatus state="recording" duration={65} />);

      expect(screen.getByText('Recording')).toBeInTheDocument();
      expect(screen.getByText('01:05')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveClass('bg-red-50', 'border-red-200');
    });

    it('should format duration correctly', () => {
      const { rerender } = render(<RecordingStatus state="recording" duration={0} />);
      expect(screen.getByText('00:00')).toBeInTheDocument();

      rerender(<RecordingStatus state="recording" duration={59} />);
      expect(screen.getByText('00:59')).toBeInTheDocument();

      rerender(<RecordingStatus state="recording" duration={125} />);
      expect(screen.getByText('02:05')).toBeInTheDocument();
    });

    it('should have pulse animation', () => {
      render(<RecordingStatus state="recording" duration={10} />);
      expect(screen.getByRole('status')).toHaveClass('animate-pulse');
    });

    it('should announce recording time to screen readers', () => {
      render(<RecordingStatus state="recording" duration={45} />);
      expect(screen.getByText('Recording for 00:45', { exact: false })).toBeInTheDocument();
    });
  });

  describe('Processing State', () => {
    it('should render processing state', () => {
      render(<RecordingStatus state="processing" />);

      expect(screen.getByText('Processing Audio')).toBeInTheDocument();
      expect(screen.getByText('Converting your recording...')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveClass('bg-yellow-50', 'border-yellow-200');
    });

    it('should show spinner in processing state', () => {
      render(<RecordingStatus state="processing" />);
      const spinner = screen.getByRole('status').querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Analyzing State', () => {
    it('should render analyzing state', () => {
      render(<RecordingStatus state="analyzing" />);

      expect(screen.getByText('Analyzing Content')).toBeInTheDocument();
      expect(screen.getByText('Extracting insights...')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveClass('bg-purple-50', 'border-purple-200');
    });

    it('should show spinner in analyzing state', () => {
      render(<RecordingStatus state="analyzing" />);
      const spinner = screen.getByRole('status').querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Complete State', () => {
    it('should render complete state', () => {
      render(<RecordingStatus state="complete" />);

      expect(screen.getByText('Complete')).toBeInTheDocument();
      expect(screen.getByText('Successfully processed your recording')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveClass('bg-green-50', 'border-green-200');
    });

    it('should show dismiss button', () => {
      const onDismiss = vi.fn();
      render(<RecordingStatus state="complete" onDismiss={onDismiss} />);

      const dismissButton = screen.getByLabelText('Dismiss notification');
      expect(dismissButton).toBeInTheDocument();
    });

    it('should call onDismiss when dismiss button clicked', () => {
      const onDismiss = vi.fn();
      render(<RecordingStatus state="complete" onDismiss={onDismiss} />);

      const dismissButton = screen.getByLabelText('Dismiss notification');
      fireEvent.click(dismissButton);

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('should auto-dismiss after 2 seconds', async () => {
      vi.useFakeTimers();
      const onDismiss = vi.fn();
      render(<RecordingStatus state="complete" onDismiss={onDismiss} />);

      expect(onDismiss).not.toHaveBeenCalled();

      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(onDismiss).toHaveBeenCalledTimes(1);
      });

      vi.useRealTimers();
    });

    it('should not auto-dismiss if onDismiss not provided', () => {
      vi.useFakeTimers();
      render(<RecordingStatus state="complete" />);

      vi.advanceTimersByTime(2000);

      // Should not throw error
      expect(screen.getByText('Complete')).toBeInTheDocument();

      vi.useRealTimers();
    });
  });

  describe('Error State', () => {
    it('should render error state with default message', () => {
      render(<RecordingStatus state="error" />);

      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveClass('bg-red-50', 'border-red-200');
    });

    it('should render error state with custom message', () => {
      render(<RecordingStatus state="error" errorMessage="Failed to connect to API" />);

      expect(screen.getByText('Failed to connect to API')).toBeInTheDocument();
    });

    it('should show retry button', () => {
      const onRetry = vi.fn();
      render(<RecordingStatus state="error" onRetry={onRetry} />);

      const retryButton = screen.getByLabelText('Retry recording');
      expect(retryButton).toBeInTheDocument();
      expect(retryButton).toHaveTextContent('Retry');
    });

    it('should call onRetry when retry button clicked', () => {
      const onRetry = vi.fn();
      render(<RecordingStatus state="error" onRetry={onRetry} />);

      const retryButton = screen.getByLabelText('Retry recording');
      fireEvent.click(retryButton);

      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should not show retry button if onRetry not provided', () => {
      render(<RecordingStatus state="error" />);

      expect(screen.queryByLabelText('Retry recording')).not.toBeInTheDocument();
    });
  });

  describe('State Transitions', () => {
    it('should update visual appearance when state changes', () => {
      const { rerender } = render(<RecordingStatus state="ready" />);
      expect(screen.getByRole('status')).toHaveClass('bg-blue-50');

      rerender(<RecordingStatus state="recording" duration={5} />);
      expect(screen.getByRole('status')).toHaveClass('bg-red-50');

      rerender(<RecordingStatus state="analyzing" />);
      expect(screen.getByRole('status')).toHaveClass('bg-purple-50');

      rerender(<RecordingStatus state="complete" />);
      expect(screen.getByRole('status')).toHaveClass('bg-green-50');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<RecordingStatus state="analyzing" />);
      const status = screen.getByRole('status');

      expect(status).toHaveAttribute('aria-live', 'polite');
      expect(status).toHaveAttribute('aria-atomic', 'true');
    });

    it('should provide screen reader announcements for each state', () => {
      const states: RecordingState[] = ['ready', 'recording', 'processing', 'analyzing', 'complete', 'error'];

      states.forEach((state) => {
        const { container, unmount } = render(<RecordingStatus state={state} duration={30} />);
        const srOnly = container.querySelector('.sr-only');
        expect(srOnly).toBeInTheDocument();
        unmount();
      });
    });

    it('should have accessible button labels', () => {
      const onRetry = vi.fn();
      const onDismiss = vi.fn();

      const { rerender } = render(<RecordingStatus state="error" onRetry={onRetry} />);
      expect(screen.getByLabelText('Retry recording')).toBeInTheDocument();

      rerender(<RecordingStatus state="complete" onDismiss={onDismiss} />);
      expect(screen.getByLabelText('Dismiss notification')).toBeInTheDocument();
    });

    it('should have proper focus styles on interactive elements', () => {
      const onRetry = vi.fn();
      render(<RecordingStatus state="error" onRetry={onRetry} />);

      const retryButton = screen.getByLabelText('Retry recording');
      expect(retryButton).toHaveClass('focus:ring-2', 'focus:ring-red-500');
    });
  });
});
