/**
 * Tests for LogDetailView Component
 * AI-31: Implement LogDetailView
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LogDetailView } from '../src/renderer/components/LogDetailView';
import type { LogWithSegments } from '../src/types/database';

describe('LogDetailView', () => {
  // Helper to create mock log data
  const createMockLog = (overrides?: Partial<LogWithSegments>): LogWithSegments => ({
    id: 1,
    date: '2024-01-15',
    audioPath: '/path/to/audio.wav',
    transcript: 'This is a sample transcript of my daily thoughts.',
    summary: 'Daily summary',
    pendingAnalysis: false,
    retryCount: 0,
    lastError: null,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:35:00Z',
    todos: [],
    ideas: [],
    learnings: [],
    accomplishments: [],
    ...overrides,
  });

  describe('Header Section', () => {
    it('should display formatted date and time', () => {
      const log = createMockLog();
      render(<LogDetailView log={log} />);

      // Check for date elements (exact format may vary by locale)
      expect(screen.getByText(/Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/)).toBeInTheDocument();
      expect(screen.getByText(/January|2024/)).toBeInTheDocument();
    });

    it('should show play audio button when audio is available', () => {
      const log = createMockLog({ audioPath: '/path/to/audio.wav' });
      render(<LogDetailView log={log} />);

      const playButton = screen.getByLabelText('Play audio recording');
      expect(playButton).toBeInTheDocument();
      expect(playButton).toHaveTextContent('Play Audio');
    });

    it('should hide play audio button when audio is not available', () => {
      const log = createMockLog({ audioPath: null });
      render(<LogDetailView log={log} />);

      expect(screen.queryByLabelText('Play audio recording')).not.toBeInTheDocument();
    });

    it('should call onPlayAudio when play button is clicked', () => {
      const onPlayAudio = vi.fn();
      const log = createMockLog({ audioPath: '/path/to/audio.wav' });
      render(<LogDetailView log={log} onPlayAudio={onPlayAudio} />);

      const playButton = screen.getByLabelText('Play audio recording');
      fireEvent.click(playButton);

      expect(onPlayAudio).toHaveBeenCalledWith('/path/to/audio.wav');
      expect(onPlayAudio).toHaveBeenCalledTimes(1);
    });

    it('should disable play button when onPlayAudio is not provided', () => {
      const log = createMockLog({ audioPath: '/path/to/audio.wav' });
      render(<LogDetailView log={log} />);

      const playButton = screen.getByLabelText('Play audio recording');
      expect(playButton).toBeDisabled();
    });

    it('should show total item count in header', () => {
      const log = createMockLog({
        todos: [{ id: 1, logId: 1, text: 'Task', completed: false, dueDate: null, priority: 2, createdAt: '2024-01-15T10:30:00Z', updatedAt: '2024-01-15T10:30:00Z' }],
        ideas: [{ id: 1, logId: 1, text: 'Idea', status: 'raw', tags: null, createdAt: '2024-01-15T10:30:00Z', updatedAt: '2024-01-15T10:30:00Z' }],
        learnings: [{ id: 1, logId: 1, text: 'Learning', category: null, createdAt: '2024-01-15T10:30:00Z' }],
      });
      render(<LogDetailView log={log} />);

      expect(screen.getByText('3 items extracted')).toBeInTheDocument();
    });

    it('should show singular form for single item', () => {
      const log = createMockLog({
        todos: [{ id: 1, logId: 1, text: 'Task', completed: false, dueDate: null, priority: 2, createdAt: '2024-01-15T10:30:00Z', updatedAt: '2024-01-15T10:30:00Z' }],
      });
      render(<LogDetailView log={log} />);

      expect(screen.getByText('1 item extracted')).toBeInTheDocument();
    });
  });

  describe('Back Button', () => {
    it('should show back button when onBack is provided', () => {
      const onBack = vi.fn();
      const log = createMockLog();
      render(<LogDetailView log={log} onBack={onBack} />);

      expect(screen.getByLabelText('Go back to log list')).toBeInTheDocument();
      expect(screen.getByText('Back to Logs')).toBeInTheDocument();
    });

    it('should call onBack when back button is clicked', () => {
      const onBack = vi.fn();
      const log = createMockLog();
      render(<LogDetailView log={log} onBack={onBack} />);

      const backButton = screen.getByLabelText('Go back to log list');
      fireEvent.click(backButton);

      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('should hide back button when onBack is not provided', () => {
      const log = createMockLog();
      render(<LogDetailView log={log} />);

      expect(screen.queryByLabelText('Go back to log list')).not.toBeInTheDocument();
    });
  });

  describe('Transcript Section', () => {
    it('should display transcript when available', () => {
      const log = createMockLog({
        transcript: 'This is my daily thought transcript.',
      });
      render(<LogDetailView log={log} />);

      expect(screen.getByText('Transcript')).toBeInTheDocument();
      expect(screen.getByText('This is my daily thought transcript.')).toBeInTheDocument();
    });

    it('should not show transcript section when transcript is null', () => {
      const log = createMockLog({ transcript: null });
      render(<LogDetailView log={log} />);

      expect(screen.queryByText('Transcript')).not.toBeInTheDocument();
    });

    it('should preserve whitespace in transcript', () => {
      const log = createMockLog({
        transcript: 'Line one\n\nLine two\n\nLine three',
      });
      const { container } = render(<LogDetailView log={log} />);

      // Check that whitespace-pre-wrap class is applied to preserve formatting
      const transcriptElement = container.querySelector('.whitespace-pre-wrap');
      expect(transcriptElement).toBeInTheDocument();
      expect(transcriptElement).toHaveClass('whitespace-pre-wrap');

      // Verify the transcript content is rendered (whitespace normalization in DOM is expected)
      expect(transcriptElement).toHaveTextContent(/Line one/);
      expect(transcriptElement).toHaveTextContent(/Line two/);
      expect(transcriptElement).toHaveTextContent(/Line three/);
    });
  });

  describe('Todos Section', () => {
    it('should display todos with correct count', () => {
      const log = createMockLog({
        todos: [
          { id: 1, logId: 1, text: 'First task', completed: false, dueDate: null, priority: 2, createdAt: '2024-01-15T10:30:00Z', updatedAt: '2024-01-15T10:30:00Z' },
          { id: 2, logId: 1, text: 'Second task', completed: true, dueDate: null, priority: 1, createdAt: '2024-01-15T10:30:00Z', updatedAt: '2024-01-15T10:30:00Z' },
        ],
      });
      render(<LogDetailView log={log} />);

      expect(screen.getByText('Todos (2)')).toBeInTheDocument();
      expect(screen.getByText('First task')).toBeInTheDocument();
      expect(screen.getByText('Second task')).toBeInTheDocument();
    });

    it('should show completed state for todos', () => {
      const log = createMockLog({
        todos: [
          { id: 1, logId: 1, text: 'Completed task', completed: true, dueDate: null, priority: 2, createdAt: '2024-01-15T10:30:00Z', updatedAt: '2024-01-15T10:30:00Z' },
          { id: 2, logId: 1, text: 'Pending task', completed: false, dueDate: null, priority: 2, createdAt: '2024-01-15T10:30:00Z', updatedAt: '2024-01-15T10:30:00Z' },
        ],
      });
      render(<LogDetailView log={log} />);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[0]).toBeChecked();
      expect(checkboxes[1]).not.toBeChecked();
    });

    it('should display priority badges', () => {
      const log = createMockLog({
        todos: [
          { id: 1, logId: 1, text: 'High priority', completed: false, dueDate: null, priority: 1, createdAt: '2024-01-15T10:30:00Z', updatedAt: '2024-01-15T10:30:00Z' },
          { id: 2, logId: 1, text: 'Medium priority', completed: false, dueDate: null, priority: 2, createdAt: '2024-01-15T10:30:00Z', updatedAt: '2024-01-15T10:30:00Z' },
          { id: 3, logId: 1, text: 'Low priority', completed: false, dueDate: null, priority: 3, createdAt: '2024-01-15T10:30:00Z', updatedAt: '2024-01-15T10:30:00Z' },
        ],
      });
      render(<LogDetailView log={log} />);

      expect(screen.getByText('High Priority')).toBeInTheDocument();
      expect(screen.getByText('Medium Priority')).toBeInTheDocument();
      expect(screen.getByText('Low Priority')).toBeInTheDocument();
    });

    it('should display due date when available', () => {
      const log = createMockLog({
        todos: [
          { id: 1, logId: 1, text: 'Task with due date', completed: false, dueDate: '2024-01-20', priority: 2, createdAt: '2024-01-15T10:30:00Z', updatedAt: '2024-01-15T10:30:00Z' },
        ],
      });
      render(<LogDetailView log={log} />);

      expect(screen.getByText(/Due:/)).toBeInTheDocument();
    });

    it('should not show todos section when no todos', () => {
      const log = createMockLog({ todos: [] });
      render(<LogDetailView log={log} />);

      expect(screen.queryByText(/Todos \(\d+\)/)).not.toBeInTheDocument();
    });
  });

  describe('Ideas Section', () => {
    it('should display ideas with correct count', () => {
      const log = createMockLog({
        ideas: [
          { id: 1, logId: 1, text: 'First idea', status: 'raw', tags: null, createdAt: '2024-01-15T10:30:00Z', updatedAt: '2024-01-15T10:30:00Z' },
          { id: 2, logId: 1, text: 'Second idea', status: 'developing', tags: null, createdAt: '2024-01-15T10:30:00Z', updatedAt: '2024-01-15T10:30:00Z' },
        ],
      });
      render(<LogDetailView log={log} />);

      expect(screen.getByText('Ideas (2)')).toBeInTheDocument();
      expect(screen.getByText('First idea')).toBeInTheDocument();
      expect(screen.getByText('Second idea')).toBeInTheDocument();
    });

    it('should display idea status badges', () => {
      const log = createMockLog({
        ideas: [
          { id: 1, logId: 1, text: 'Idea', status: 'actionable', tags: null, createdAt: '2024-01-15T10:30:00Z', updatedAt: '2024-01-15T10:30:00Z' },
        ],
      });
      render(<LogDetailView log={log} />);

      expect(screen.getByText('actionable')).toBeInTheDocument();
    });

    it('should display tags when available', () => {
      const log = createMockLog({
        ideas: [
          { id: 1, logId: 1, text: 'Tagged idea', status: 'raw', tags: JSON.stringify(['tech', 'product']), createdAt: '2024-01-15T10:30:00Z', updatedAt: '2024-01-15T10:30:00Z' },
        ],
      });
      render(<LogDetailView log={log} />);

      expect(screen.getByText('tech')).toBeInTheDocument();
      expect(screen.getByText('product')).toBeInTheDocument();
    });

    it('should not show ideas section when no ideas', () => {
      const log = createMockLog({ ideas: [] });
      render(<LogDetailView log={log} />);

      expect(screen.queryByText(/Ideas \(\d+\)/)).not.toBeInTheDocument();
    });
  });

  describe('Learnings Section', () => {
    it('should display learnings with correct count', () => {
      const log = createMockLog({
        learnings: [
          { id: 1, logId: 1, text: 'First learning', category: null, createdAt: '2024-01-15T10:30:00Z' },
          { id: 2, logId: 1, text: 'Second learning', category: 'tech', createdAt: '2024-01-15T10:30:00Z' },
        ],
      });
      render(<LogDetailView log={log} />);

      expect(screen.getByText('Learnings (2)')).toBeInTheDocument();
      expect(screen.getByText('First learning')).toBeInTheDocument();
      expect(screen.getByText('Second learning')).toBeInTheDocument();
    });

    it('should display category when available', () => {
      const log = createMockLog({
        learnings: [
          { id: 1, logId: 1, text: 'Learning', category: 'typescript', createdAt: '2024-01-15T10:30:00Z' },
        ],
      });
      render(<LogDetailView log={log} />);

      expect(screen.getByText('typescript')).toBeInTheDocument();
    });

    it('should not show learnings section when no learnings', () => {
      const log = createMockLog({ learnings: [] });
      render(<LogDetailView log={log} />);

      expect(screen.queryByText(/Learnings \(\d+\)/)).not.toBeInTheDocument();
    });
  });

  describe('Accomplishments Section', () => {
    it('should display accomplishments with correct count', () => {
      const log = createMockLog({
        accomplishments: [
          { id: 1, logId: 1, text: 'First accomplishment', impact: 'medium', createdAt: '2024-01-15T10:30:00Z' },
          { id: 2, logId: 1, text: 'Second accomplishment', impact: 'high', createdAt: '2024-01-15T10:30:00Z' },
        ],
      });
      render(<LogDetailView log={log} />);

      expect(screen.getByText('Accomplishments (2)')).toBeInTheDocument();
      expect(screen.getByText('First accomplishment')).toBeInTheDocument();
      expect(screen.getByText('Second accomplishment')).toBeInTheDocument();
    });

    it('should display impact badges', () => {
      const log = createMockLog({
        accomplishments: [
          { id: 1, logId: 1, text: 'High impact', impact: 'high', createdAt: '2024-01-15T10:30:00Z' },
          { id: 2, logId: 1, text: 'Medium impact', impact: 'medium', createdAt: '2024-01-15T10:30:00Z' },
          { id: 3, logId: 1, text: 'Low impact', impact: 'low', createdAt: '2024-01-15T10:30:00Z' },
        ],
      });
      render(<LogDetailView log={log} />);

      expect(screen.getByText('high impact')).toBeInTheDocument();
      expect(screen.getByText('medium impact')).toBeInTheDocument();
      expect(screen.getByText('low impact')).toBeInTheDocument();
    });

    it('should not show accomplishments section when no accomplishments', () => {
      const log = createMockLog({ accomplishments: [] });
      render(<LogDetailView log={log} />);

      expect(screen.queryByText(/Accomplishments \(\d+\)/)).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no content available', () => {
      const log = createMockLog({
        transcript: null,
        todos: [],
        ideas: [],
        learnings: [],
        accomplishments: [],
      });
      render(<LogDetailView log={log} />);

      expect(screen.getByText('No Content Available')).toBeInTheDocument();
      expect(screen.getByText('This log has no transcript or extracted items yet.')).toBeInTheDocument();
    });

    it('should not show empty state when transcript is present', () => {
      const log = createMockLog({
        transcript: 'Some transcript',
        todos: [],
        ideas: [],
        learnings: [],
        accomplishments: [],
      });
      render(<LogDetailView log={log} />);

      expect(screen.queryByText('No Content Available')).not.toBeInTheDocument();
    });

    it('should not show empty state when items are present', () => {
      const log = createMockLog({
        transcript: null,
        todos: [{ id: 1, logId: 1, text: 'Task', completed: false, dueDate: null, priority: 2, createdAt: '2024-01-15T10:30:00Z', updatedAt: '2024-01-15T10:30:00Z' }],
      });
      render(<LogDetailView log={log} />);

      expect(screen.queryByText('No Content Available')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for interactive elements', () => {
      const onBack = vi.fn();
      const onPlayAudio = vi.fn();
      const log = createMockLog({ audioPath: '/path/to/audio.wav' });
      render(<LogDetailView log={log} onBack={onBack} onPlayAudio={onPlayAudio} />);

      expect(screen.getByLabelText('Go back to log list')).toBeInTheDocument();
      expect(screen.getByLabelText('Play audio recording')).toBeInTheDocument();
    });

    it('should have proper checkbox labels for todos', () => {
      const log = createMockLog({
        todos: [
          { id: 1, logId: 1, text: 'Test task', completed: false, dueDate: null, priority: 2, createdAt: '2024-01-15T10:30:00Z', updatedAt: '2024-01-15T10:30:00Z' },
        ],
      });
      render(<LogDetailView log={log} />);

      expect(screen.getByLabelText('Todo: Test task')).toBeInTheDocument();
    });

    it('should have proper focus styles', () => {
      const onBack = vi.fn();
      const log = createMockLog();
      render(<LogDetailView log={log} onBack={onBack} />);

      const backButton = screen.getByLabelText('Go back to log list');
      expect(backButton).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500');
    });
  });

  describe('Layout and Styling', () => {
    it('should render with proper container classes', () => {
      const log = createMockLog();
      const { container } = render(<LogDetailView log={log} />);

      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveClass('w-full', 'h-full', 'bg-gray-50', 'overflow-auto');
    });

    it('should apply correct color schemes to item groups', () => {
      const log = createMockLog({
        todos: [{ id: 1, logId: 1, text: 'Task', completed: false, dueDate: null, priority: 2, createdAt: '2024-01-15T10:30:00Z', updatedAt: '2024-01-15T10:30:00Z' }],
        ideas: [{ id: 1, logId: 1, text: 'Idea', status: 'raw', tags: null, createdAt: '2024-01-15T10:30:00Z', updatedAt: '2024-01-15T10:30:00Z' }],
        learnings: [{ id: 1, logId: 1, text: 'Learning', category: null, createdAt: '2024-01-15T10:30:00Z' }],
        accomplishments: [{ id: 1, logId: 1, text: 'Achievement', impact: 'high', createdAt: '2024-01-15T10:30:00Z' }],
      });
      const { container } = render(<LogDetailView log={log} />);

      // Check color indicators
      expect(container.querySelector('.bg-red-500')).toBeInTheDocument(); // Todos
      expect(container.querySelector('.bg-purple-500')).toBeInTheDocument(); // Ideas
      expect(container.querySelector('.bg-blue-500')).toBeInTheDocument(); // Learnings
      expect(container.querySelector('.bg-green-500')).toBeInTheDocument(); // Accomplishments
    });
  });
});
