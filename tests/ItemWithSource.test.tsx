/**
 * Tests for ItemWithSource Component
 * AI-32: Add item-to-log traceability links
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ItemWithSource } from '../src/renderer/components/ItemWithSource';
import type { Todo, Idea, Learning, Accomplishment, Log } from '../src/types/database';

describe('ItemWithSource', () => {
  const mockLog: Log = {
    id: 1,
    date: '2024-01-15',
    audioPath: '/path/to/audio.wav',
    transcript: 'Test transcript',
    summary: 'Test summary',
    pendingAnalysis: false,
    retryCount: 0,
    lastError: null,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
  };

  const mockTodo: Todo = {
    id: 1,
    logId: 1,
    text: 'Complete the test',
    completed: false,
    dueDate: null,
    priority: 2,
    createdAt: '2024-01-15T10:31:00Z',
    updatedAt: '2024-01-15T10:31:00Z',
  };

  const mockIdea: Idea = {
    id: 2,
    logId: 1,
    text: 'Build a new feature',
    status: 'raw',
    tags: null,
    createdAt: '2024-01-15T10:32:00Z',
    updatedAt: '2024-01-15T10:32:00Z',
  };

  const mockLearning: Learning = {
    id: 3,
    logId: 1,
    text: 'Learned about React testing',
    category: 'testing',
    createdAt: '2024-01-15T10:33:00Z',
  };

  const mockAccomplishment: Accomplishment = {
    id: 4,
    logId: 1,
    text: 'Completed the project',
    impact: 'high',
    createdAt: '2024-01-15T10:34:00Z',
  };

  const mockOnViewSource = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render todo item with source information', () => {
      render(
        <ItemWithSource
          item={mockTodo}
          sourceLog={mockLog}
          onViewSource={mockOnViewSource}
        />
      );

      expect(screen.getByTestId('item-with-source')).toBeInTheDocument();
      expect(screen.getByTestId('item-type')).toHaveTextContent('Todo');
      expect(screen.getByTestId('item-text')).toHaveTextContent('Complete the test');
      expect(screen.getByTestId('source-timestamp')).toBeInTheDocument();
      expect(screen.getByTestId('view-source-button')).toBeInTheDocument();
    });

    it('should render idea item with correct type', () => {
      render(
        <ItemWithSource
          item={mockIdea}
          sourceLog={mockLog}
          onViewSource={mockOnViewSource}
        />
      );

      expect(screen.getByTestId('item-type')).toHaveTextContent('Idea');
      expect(screen.getByTestId('item-text')).toHaveTextContent('Build a new feature');
    });

    it('should render learning item with correct type', () => {
      render(
        <ItemWithSource
          item={mockLearning}
          sourceLog={mockLog}
          onViewSource={mockOnViewSource}
        />
      );

      expect(screen.getByTestId('item-type')).toHaveTextContent('Learning');
      expect(screen.getByTestId('item-text')).toHaveTextContent('Learned about React testing');
    });

    it('should render accomplishment item with correct type', () => {
      render(
        <ItemWithSource
          item={mockAccomplishment}
          sourceLog={mockLog}
          onViewSource={mockOnViewSource}
        />
      );

      expect(screen.getByTestId('item-type')).toHaveTextContent('Accomplishment');
      expect(screen.getByTestId('item-text')).toHaveTextContent('Completed the project');
    });

    it('should format timestamp correctly', () => {
      render(
        <ItemWithSource
          item={mockTodo}
          sourceLog={mockLog}
          onViewSource={mockOnViewSource}
        />
      );

      const timestamp = screen.getByTestId('source-timestamp');
      expect(timestamp).toHaveTextContent(/From log:/);
      // Timestamp format will vary by locale, just check it contains expected parts
      expect(timestamp.textContent).toMatch(/Jan|15|2024/);
    });

    it('should apply custom className', () => {
      render(
        <ItemWithSource
          item={mockTodo}
          sourceLog={mockLog}
          onViewSource={mockOnViewSource}
          className="custom-class"
        />
      );

      const element = screen.getByTestId('item-with-source');
      expect(element).toHaveClass('custom-class');
    });
  });

  describe('Interactions', () => {
    it('should call onViewSource when View Source button is clicked', () => {
      render(
        <ItemWithSource
          item={mockTodo}
          sourceLog={mockLog}
          onViewSource={mockOnViewSource}
        />
      );

      const button = screen.getByTestId('view-source-button');
      fireEvent.click(button);

      expect(mockOnViewSource).toHaveBeenCalledTimes(1);
      expect(mockOnViewSource).toHaveBeenCalledWith(mockTodo.logId, mockTodo.id);
    });

    it('should prevent default behavior when clicking View Source', () => {
      render(
        <ItemWithSource
          item={mockTodo}
          sourceLog={mockLog}
          onViewSource={mockOnViewSource}
        />
      );

      const button = screen.getByTestId('view-source-button');
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      button.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should have accessible button label', () => {
      render(
        <ItemWithSource
          item={mockTodo}
          sourceLog={mockLog}
          onViewSource={mockOnViewSource}
        />
      );

      const button = screen.getByTestId('view-source-button');
      expect(button).toHaveAttribute('aria-label', 'View source log for todo');
    });
  });

  describe('Item Type Detection', () => {
    it('should correctly identify todo by properties', () => {
      render(
        <ItemWithSource
          item={mockTodo}
          sourceLog={mockLog}
          onViewSource={mockOnViewSource}
        />
      );

      expect(screen.getByTestId('item-type')).toHaveTextContent('Todo');
    });

    it('should correctly identify idea by properties', () => {
      render(
        <ItemWithSource
          item={mockIdea}
          sourceLog={mockLog}
          onViewSource={mockOnViewSource}
        />
      );

      expect(screen.getByTestId('item-type')).toHaveTextContent('Idea');
    });

    it('should correctly identify learning by properties', () => {
      render(
        <ItemWithSource
          item={mockLearning}
          sourceLog={mockLog}
          onViewSource={mockOnViewSource}
        />
      );

      expect(screen.getByTestId('item-type')).toHaveTextContent('Learning');
    });

    it('should correctly identify accomplishment by properties', () => {
      render(
        <ItemWithSource
          item={mockAccomplishment}
          sourceLog={mockLog}
          onViewSource={mockOnViewSource}
        />
      );

      expect(screen.getByTestId('item-type')).toHaveTextContent('Accomplishment');
    });
  });

  describe('Edge Cases', () => {
    it('should handle items with very long text', () => {
      const longTextTodo: Todo = {
        ...mockTodo,
        text: 'This is a very long todo item that contains a lot of text and should be handled gracefully by the component without breaking the layout or causing any issues with rendering',
      };

      render(
        <ItemWithSource
          item={longTextTodo}
          sourceLog={mockLog}
          onViewSource={mockOnViewSource}
        />
      );

      expect(screen.getByTestId('item-text')).toHaveTextContent(/very long todo item/);
    });

    it('should handle different timestamp formats', () => {
      const logWithDifferentTimestamp: Log = {
        ...mockLog,
        createdAt: '2024-12-31T23:59:59Z',
      };

      render(
        <ItemWithSource
          item={mockTodo}
          sourceLog={logWithDifferentTimestamp}
          onViewSource={mockOnViewSource}
        />
      );

      const timestamp = screen.getByTestId('source-timestamp');
      expect(timestamp).toBeInTheDocument();
      expect(timestamp.textContent).toMatch(/Dec|31|2024/);
    });
  });
});
