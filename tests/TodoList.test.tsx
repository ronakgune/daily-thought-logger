/**
 * TodoList Component Tests
 * AI-27: Build TodoList component with completion toggle
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TodoList, TodoWithConfidence } from '../src/renderer/components/TodoList';

describe('TodoList Component', () => {
  const mockTodos: TodoWithConfidence[] = [
    {
      id: 1,
      logId: 100,
      text: 'Write unit tests',
      completed: false,
      dueDate: '2024-01-20',
      priority: 1, // High
      confidence: 0.95,
      logDate: '2024-01-15',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    },
    {
      id: 2,
      logId: 100,
      text: 'Review pull request',
      completed: false,
      dueDate: null,
      priority: 2, // Medium
      confidence: 0.88,
      logDate: '2024-01-15',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    },
    {
      id: 3,
      logId: 101,
      text: 'Update documentation',
      completed: true,
      dueDate: null,
      priority: 3, // Low
      confidence: 0.92,
      logDate: '2024-01-14',
      createdAt: '2024-01-14T10:00:00Z',
      updatedAt: '2024-01-15T12:00:00Z',
    },
  ];

  // ============================================================================
  // Basic Rendering Tests
  // ============================================================================

  describe('Rendering', () => {
    it('should render the component with todos', () => {
      render(<TodoList todos={mockTodos} />);

      expect(screen.getByText('Todo List')).toBeInTheDocument();
      expect(screen.getByText('Write unit tests')).toBeInTheDocument();
      expect(screen.getByText('Review pull request')).toBeInTheDocument();
      expect(screen.getByText('Update documentation')).toBeInTheDocument();
    });

    it('should display loading state', () => {
      render(<TodoList todos={[]} loading={true} />);

      expect(screen.getByText('Loading todos...')).toBeInTheDocument();
    });

    it('should display error state', () => {
      const errorMessage = 'Failed to fetch todos';
      render(<TodoList todos={[]} error={errorMessage} />);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should display empty state when no todos', () => {
      render(<TodoList todos={[]} />);

      expect(
        screen.getByText('No todos yet. Start recording to create some!')
      ).toBeInTheDocument();
    });
  });

  // ============================================================================
  // Filter Tests
  // ============================================================================

  describe('Filtering', () => {
    it('should show all todos by default', () => {
      render(<TodoList todos={mockTodos} />);

      expect(screen.getByText('Write unit tests')).toBeInTheDocument();
      expect(screen.getByText('Review pull request')).toBeInTheDocument();
      expect(screen.getByText('Update documentation')).toBeInTheDocument();
    });

    it('should filter to show only active todos', () => {
      render(<TodoList todos={mockTodos} />);

      const activeButton = screen.getByLabelText('Show active todos');
      fireEvent.click(activeButton);

      expect(screen.getByText('Write unit tests')).toBeInTheDocument();
      expect(screen.getByText('Review pull request')).toBeInTheDocument();
      expect(screen.queryByText('Update documentation')).not.toBeInTheDocument();
    });

    it('should filter to show only completed todos', () => {
      render(<TodoList todos={mockTodos} />);

      const completedButton = screen.getByLabelText('Show completed todos');
      fireEvent.click(completedButton);

      expect(screen.queryByText('Write unit tests')).not.toBeInTheDocument();
      expect(screen.queryByText('Review pull request')).not.toBeInTheDocument();
      expect(screen.getByText('Update documentation')).toBeInTheDocument();
    });

    it('should show correct empty state for active filter', () => {
      const completedTodos = mockTodos.map((t) => ({ ...t, completed: true }));
      render(<TodoList todos={completedTodos} />);

      const activeButton = screen.getByLabelText('Show active todos');
      fireEvent.click(activeButton);

      expect(screen.getByText('No active todos. Great job!')).toBeInTheDocument();
    });

    it('should show correct empty state for completed filter', () => {
      const activeTodos = mockTodos.map((t) => ({ ...t, completed: false }));
      render(<TodoList todos={activeTodos} />);

      const completedButton = screen.getByLabelText('Show completed todos');
      fireEvent.click(completedButton);

      expect(screen.getByText('No completed todos yet.')).toBeInTheDocument();
    });

    it('should display correct counts in filter buttons', () => {
      render(<TodoList todos={mockTodos} />);

      expect(screen.getByText(/All \(3\)/)).toBeInTheDocument();
      expect(screen.getByText(/Active \(2\)/)).toBeInTheDocument();
      expect(screen.getByText(/Completed \(1\)/)).toBeInTheDocument();
    });
  });

  // ============================================================================
  // Priority Indicator Tests
  // ============================================================================

  describe('Priority Indicators', () => {
    it('should display high priority badge', () => {
      render(<TodoList todos={[mockTodos[0]]} />);

      const highBadge = screen.getByText('High');
      expect(highBadge).toBeInTheDocument();
      expect(highBadge).toHaveClass('bg-red-500');
    });

    it('should display medium priority badge', () => {
      render(<TodoList todos={[mockTodos[1]]} />);

      const mediumBadge = screen.getByText('Medium');
      expect(mediumBadge).toBeInTheDocument();
      expect(mediumBadge).toHaveClass('bg-yellow-500');
    });

    it('should display low priority badge', () => {
      render(<TodoList todos={[mockTodos[2]]} />);

      const lowBadge = screen.getByText('Low');
      expect(lowBadge).toBeInTheDocument();
      expect(lowBadge).toHaveClass('bg-green-500');
    });
  });

  // ============================================================================
  // Confidence Score Tests
  // ============================================================================

  describe('Confidence Scores', () => {
    it('should display confidence score', () => {
      render(<TodoList todos={[mockTodos[0]]} />);

      expect(screen.getByText('95%')).toBeInTheDocument();
    });

    it('should not display confidence if not provided', () => {
      const todoWithoutConfidence = { ...mockTodos[0], confidence: undefined };
      render(<TodoList todos={[todoWithoutConfidence]} />);

      expect(screen.queryByText('Confidence:')).not.toBeInTheDocument();
    });

    it('should format confidence score correctly', () => {
      const todo = { ...mockTodos[0], confidence: 0.876 };
      render(<TodoList todos={[todo]} />);

      expect(screen.getByText('88%')).toBeInTheDocument();
    });

    it('should apply correct color for high confidence', () => {
      const todo = { ...mockTodos[0], confidence: 0.95 };
      const { container } = render(<TodoList todos={[todo]} />);

      const confidenceElement = screen.getByText('95%');
      expect(confidenceElement).toHaveClass('text-green-600');
    });

    it('should apply correct color for medium confidence', () => {
      const todo = { ...mockTodos[0], confidence: 0.75 };
      const { container } = render(<TodoList todos={[todo]} />);

      const confidenceElement = screen.getByText('75%');
      expect(confidenceElement).toHaveClass('text-blue-600');
    });

    it('should apply correct color for low confidence', () => {
      const todo = { ...mockTodos[0], confidence: 0.55 };
      const { container } = render(<TodoList todos={[todo]} />);

      const confidenceElement = screen.getByText('55%');
      expect(confidenceElement).toHaveClass('text-yellow-600');
    });

    it('should apply correct color for very low confidence', () => {
      const todo = { ...mockTodos[0], confidence: 0.35 };
      const { container } = render(<TodoList todos={[todo]} />);

      const confidenceElement = screen.getByText('35%');
      expect(confidenceElement).toHaveClass('text-red-600');
    });
  });

  // ============================================================================
  // Completion Toggle Tests
  // ============================================================================

  describe('Completion Toggle', () => {
    it('should call onToggleComplete when checkbox is clicked', () => {
      const onToggleComplete = vi.fn();
      render(<TodoList todos={mockTodos} onToggleComplete={onToggleComplete} />);

      const checkbox = screen.getAllByRole('checkbox')[0];
      fireEvent.click(checkbox);

      expect(onToggleComplete).toHaveBeenCalledWith(1, true);
    });

    it('should render checked checkbox for completed todo', () => {
      render(<TodoList todos={[mockTodos[2]]} />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();
    });

    it('should render unchecked checkbox for incomplete todo', () => {
      render(<TodoList todos={[mockTodos[0]]} />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();
    });

    it('should apply strikethrough to completed todo text', () => {
      render(<TodoList todos={[mockTodos[2]]} />);

      const todoText = screen.getByText('Update documentation');
      expect(todoText).toHaveClass('line-through');
    });
  });

  // ============================================================================
  // Source Log Link Tests
  // ============================================================================

  describe('Source Log Link', () => {
    it('should call onViewLog when todo is clicked', () => {
      const onViewLog = vi.fn();
      render(<TodoList todos={mockTodos} onViewLog={onViewLog} />);

      const todoElement = screen.getByText('Write unit tests').closest('div[role="button"]');
      if (todoElement) {
        fireEvent.click(todoElement);
      }

      expect(onViewLog).toHaveBeenCalledWith(100);
    });

    it('should not call onViewLog when checkbox is clicked', () => {
      const onViewLog = vi.fn();
      render(<TodoList todos={mockTodos} onViewLog={onViewLog} />);

      const checkbox = screen.getAllByRole('checkbox')[0];
      fireEvent.click(checkbox);

      expect(onViewLog).not.toHaveBeenCalled();
    });

    it('should display log date if provided', () => {
      render(<TodoList todos={[mockTodos[0]]} />);

      expect(screen.getByText('From:')).toBeInTheDocument();
      // Date format can vary by locale, just check it's there
      const fromElement = screen.getByText('From:').parentElement;
      expect(fromElement).toBeTruthy();
      expect(fromElement?.textContent).toContain('2024');
    });

    it('should display due date if provided', () => {
      render(<TodoList todos={[mockTodos[0]]} />);

      expect(screen.getByText('Due:')).toBeInTheDocument();
      // Date format can vary by locale, just check it's there
      const dueElement = screen.getByText('Due:').parentElement;
      expect(dueElement).toBeTruthy();
      expect(dueElement?.textContent).toContain('2024');
    });
  });

  // ============================================================================
  // Summary Stats Tests
  // ============================================================================

  describe('Summary Stats', () => {
    it('should display summary stats when todos exist', () => {
      render(<TodoList todos={mockTodos} />);

      expect(screen.getByText(/Showing 3 of 3 todos/)).toBeInTheDocument();
      expect(screen.getByText(/1 completed, 2 active/)).toBeInTheDocument();
    });

    it('should update summary stats based on filter', () => {
      render(<TodoList todos={mockTodos} />);

      const activeButton = screen.getByLabelText('Show active todos');
      fireEvent.click(activeButton);

      expect(screen.getByText(/Showing 2 of 3 todos/)).toBeInTheDocument();
    });

    it('should not display summary stats when no todos', () => {
      render(<TodoList todos={[]} />);

      expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // Accessibility Tests
  // ============================================================================

  describe('Accessibility', () => {
    it('should have proper ARIA labels for checkboxes', () => {
      render(<TodoList todos={[mockTodos[0]]} />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAccessibleName(/Mark todo as complete/);
    });

    it('should have proper ARIA labels for filter buttons', () => {
      render(<TodoList todos={mockTodos} />);

      expect(screen.getByLabelText('Show all todos')).toBeInTheDocument();
      expect(screen.getByLabelText('Show active todos')).toBeInTheDocument();
      expect(screen.getByLabelText('Show completed todos')).toBeInTheDocument();
    });

    it('should support keyboard navigation for todos', () => {
      const onViewLog = vi.fn();
      render(<TodoList todos={[mockTodos[0]]} onViewLog={onViewLog} />);

      const todoElement = screen.getByText('Write unit tests').closest('div[role="button"]');
      if (todoElement) {
        fireEvent.keyDown(todoElement, { key: 'Enter' });
      }

      expect(onViewLog).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle todos with no callbacks gracefully', () => {
      render(<TodoList todos={mockTodos} />);

      const checkbox = screen.getAllByRole('checkbox')[0];
      expect(() => fireEvent.click(checkbox)).not.toThrow();

      const todoElement = screen.getByText('Write unit tests').closest('div[role="button"]');
      if (todoElement) {
        expect(() => fireEvent.click(todoElement)).not.toThrow();
      }
    });

    it('should handle missing optional fields', () => {
      const minimalTodo: TodoWithConfidence = {
        id: 1,
        logId: 100,
        text: 'Minimal todo',
        completed: false,
        dueDate: null,
        priority: 2,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      };

      render(<TodoList todos={[minimalTodo]} />);

      expect(screen.getByText('Minimal todo')).toBeInTheDocument();
      expect(screen.queryByText('Confidence:')).not.toBeInTheDocument();
      expect(screen.queryByText('Due:')).not.toBeInTheDocument();
      expect(screen.queryByText('From:')).not.toBeInTheDocument();
    });

    it('should handle invalid priority gracefully', () => {
      const todoWithInvalidPriority = { ...mockTodos[0], priority: 999 };
      render(<TodoList todos={[todoWithInvalidPriority]} />);

      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });
  });
});
