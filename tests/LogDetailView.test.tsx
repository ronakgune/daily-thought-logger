/**
 * Tests for LogDetailView Component
 * AI-32: Add item-to-log traceability links
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LogDetailView } from '../src/renderer/components/LogDetailView';
import type { LogWithSegments } from '../src/types/database';

describe('LogDetailView', () => {
  const mockLog: LogWithSegments = {
    id: 1,
    date: '2024-01-15',
    audioPath: '/path/to/audio.wav',
    transcript: 'This is a test transcript with important information.',
    summary: 'Test summary of the log entry.',
    pendingAnalysis: false,
    retryCount: 0,
    lastError: null,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    todos: [
      {
        id: 1,
        logId: 1,
        text: 'Complete the test',
        completed: false,
        dueDate: null,
        priority: 1,
        createdAt: '2024-01-15T10:31:00Z',
        updatedAt: '2024-01-15T10:31:00Z',
      },
      {
        id: 2,
        logId: 1,
        text: 'Review code',
        completed: true,
        dueDate: '2024-01-20',
        priority: 2,
        createdAt: '2024-01-15T10:32:00Z',
        updatedAt: '2024-01-15T10:32:00Z',
      },
    ],
    ideas: [
      {
        id: 3,
        logId: 1,
        text: 'Build a new feature',
        status: 'raw',
        tags: null,
        createdAt: '2024-01-15T10:33:00Z',
        updatedAt: '2024-01-15T10:33:00Z',
      },
    ],
    learnings: [
      {
        id: 4,
        logId: 1,
        text: 'Learned about React testing',
        category: 'testing',
        createdAt: '2024-01-15T10:34:00Z',
      },
    ],
    accomplishments: [
      {
        id: 5,
        logId: 1,
        text: 'Completed the project',
        impact: 'high',
        createdAt: '2024-01-15T10:35:00Z',
      },
    ],
  };

  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render log detail view with all sections', () => {
      render(<LogDetailView log={mockLog} />);

      expect(screen.getByTestId('log-detail-view')).toBeInTheDocument();
      expect(screen.getByTestId('log-metadata')).toBeInTheDocument();
      expect(screen.getByTestId('transcript-section')).toBeInTheDocument();
      expect(screen.getByTestId('summary-section')).toBeInTheDocument();
      expect(screen.getByTestId('todos-section')).toBeInTheDocument();
      expect(screen.getByTestId('ideas-section')).toBeInTheDocument();
      expect(screen.getByTestId('learnings-section')).toBeInTheDocument();
      expect(screen.getByTestId('accomplishments-section')).toBeInTheDocument();
    });

    it('should display log date correctly', () => {
      render(<LogDetailView log={mockLog} />);

      const dateElement = screen.getByTestId('log-date');
      expect(dateElement).toBeInTheDocument();
      // Date format may vary by locale, just check it contains the date
      expect(dateElement.textContent).toMatch(/January|15|2024/);
    });

    it('should display log timestamp correctly', () => {
      render(<LogDetailView log={mockLog} />);

      const timestampElement = screen.getByTestId('log-timestamp');
      expect(timestampElement).toBeInTheDocument();
      expect(timestampElement.textContent).toMatch(/Created at/);
    });

    it('should display transcript content', () => {
      render(<LogDetailView log={mockLog} />);

      const transcriptContent = screen.getByTestId('transcript-content');
      expect(transcriptContent).toHaveTextContent('This is a test transcript with important information.');
    });

    it('should display summary content', () => {
      render(<LogDetailView log={mockLog} />);

      const summaryContent = screen.getByTestId('summary-content');
      expect(summaryContent).toHaveTextContent('Test summary of the log entry.');
    });

    it('should render back button when onBack is provided', () => {
      render(<LogDetailView log={mockLog} onBack={mockOnBack} />);

      expect(screen.getByTestId('log-detail-header')).toBeInTheDocument();
      expect(screen.getByTestId('back-button')).toBeInTheDocument();
    });

    it('should not render back button when onBack is not provided', () => {
      render(<LogDetailView log={mockLog} />);

      expect(screen.queryByTestId('log-detail-header')).not.toBeInTheDocument();
      expect(screen.queryByTestId('back-button')).not.toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<LogDetailView log={mockLog} className="custom-class" />);

      const element = screen.getByTestId('log-detail-view');
      expect(element).toHaveClass('custom-class');
    });
  });

  describe('Items Display', () => {
    it('should display all todos with correct count', () => {
      render(<LogDetailView log={mockLog} />);

      const todosSection = screen.getByTestId('todos-section');
      expect(todosSection).toHaveTextContent('Todos (2)');
      expect(screen.getByTestId('todo-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('todo-item-2')).toBeInTheDocument();
    });

    it('should display todo metadata correctly', () => {
      render(<LogDetailView log={mockLog} />);

      const todoItem1 = screen.getByTestId('todo-item-1');
      expect(todoItem1).toHaveTextContent('Complete the test');
      expect(todoItem1).toHaveTextContent('Priority: 1');
      expect(todoItem1).toHaveTextContent('Pending');

      const todoItem2 = screen.getByTestId('todo-item-2');
      expect(todoItem2).toHaveTextContent('Review code');
      expect(todoItem2).toHaveTextContent('Priority: 2');
      expect(todoItem2).toHaveTextContent('Completed');
    });

    it('should display all ideas with correct count', () => {
      render(<LogDetailView log={mockLog} />);

      const ideasSection = screen.getByTestId('ideas-section');
      expect(ideasSection).toHaveTextContent('Ideas (1)');
      expect(screen.getByTestId('idea-item-3')).toBeInTheDocument();
    });

    it('should display idea metadata correctly', () => {
      render(<LogDetailView log={mockLog} />);

      const ideaItem = screen.getByTestId('idea-item-3');
      expect(ideaItem).toHaveTextContent('Build a new feature');
      expect(ideaItem).toHaveTextContent('Status: raw');
    });

    it('should display all learnings with correct count', () => {
      render(<LogDetailView log={mockLog} />);

      const learningsSection = screen.getByTestId('learnings-section');
      expect(learningsSection).toHaveTextContent('Learnings (1)');
      expect(screen.getByTestId('learning-item-4')).toBeInTheDocument();
    });

    it('should display learning with category', () => {
      render(<LogDetailView log={mockLog} />);

      const learningItem = screen.getByTestId('learning-item-4');
      expect(learningItem).toHaveTextContent('Learned about React testing');
      expect(learningItem).toHaveTextContent('Category: testing');
    });

    it('should display all accomplishments with correct count', () => {
      render(<LogDetailView log={mockLog} />);

      const accomplishmentsSection = screen.getByTestId('accomplishments-section');
      expect(accomplishmentsSection).toHaveTextContent('Accomplishments (1)');
      expect(screen.getByTestId('accomplishment-item-5')).toBeInTheDocument();
    });

    it('should display accomplishment metadata correctly', () => {
      render(<LogDetailView log={mockLog} />);

      const accomplishmentItem = screen.getByTestId('accomplishment-item-5');
      expect(accomplishmentItem).toHaveTextContent('Completed the project');
      expect(accomplishmentItem).toHaveTextContent('Impact: high');
    });
  });

  describe('Item Highlighting', () => {
    it('should highlight a todo when specified', () => {
      render(
        <LogDetailView
          log={mockLog}
          highlightItemId={1}
          highlightItemType="todo"
        />
      );

      const todoItem1 = screen.getByTestId('todo-item-1');
      expect(todoItem1).toHaveClass('highlighted');
      expect(todoItem1).toHaveAttribute('data-highlighted', 'true');

      const todoItem2 = screen.getByTestId('todo-item-2');
      expect(todoItem2).not.toHaveClass('highlighted');
      expect(todoItem2).toHaveAttribute('data-highlighted', 'false');
    });

    it('should highlight an idea when specified', () => {
      render(
        <LogDetailView
          log={mockLog}
          highlightItemId={3}
          highlightItemType="idea"
        />
      );

      const ideaItem = screen.getByTestId('idea-item-3');
      expect(ideaItem).toHaveClass('highlighted');
      expect(ideaItem).toHaveAttribute('data-highlighted', 'true');
    });

    it('should highlight a learning when specified', () => {
      render(
        <LogDetailView
          log={mockLog}
          highlightItemId={4}
          highlightItemType="learning"
        />
      );

      const learningItem = screen.getByTestId('learning-item-4');
      expect(learningItem).toHaveClass('highlighted');
      expect(learningItem).toHaveAttribute('data-highlighted', 'true');
    });

    it('should highlight an accomplishment when specified', () => {
      render(
        <LogDetailView
          log={mockLog}
          highlightItemId={5}
          highlightItemType="accomplishment"
        />
      );

      const accomplishmentItem = screen.getByTestId('accomplishment-item-5');
      expect(accomplishmentItem).toHaveClass('highlighted');
      expect(accomplishmentItem).toHaveAttribute('data-highlighted', 'true');
    });

    it('should not highlight when item type does not match', () => {
      render(
        <LogDetailView
          log={mockLog}
          highlightItemId={1}
          highlightItemType="idea"
        />
      );

      const todoItem1 = screen.getByTestId('todo-item-1');
      expect(todoItem1).not.toHaveClass('highlighted');
      expect(todoItem1).toHaveAttribute('data-highlighted', 'false');
    });

    it('should not highlight when no highlightItemId is provided', () => {
      render(<LogDetailView log={mockLog} />);

      const todoItem1 = screen.getByTestId('todo-item-1');
      expect(todoItem1).not.toHaveClass('highlighted');
    });
  });

  describe('Interactions', () => {
    it('should call onBack when back button is clicked', () => {
      render(<LogDetailView log={mockLog} onBack={mockOnBack} />);

      const backButton = screen.getByTestId('back-button');
      fireEvent.click(backButton);

      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it('should have accessible back button', () => {
      render(<LogDetailView log={mockLog} onBack={mockOnBack} />);

      const backButton = screen.getByTestId('back-button');
      expect(backButton).toHaveAttribute('aria-label', 'Go back');
    });
  });

  describe('Edge Cases', () => {
    it('should handle log without transcript', () => {
      const logWithoutTranscript: LogWithSegments = {
        ...mockLog,
        transcript: null,
      };

      render(<LogDetailView log={logWithoutTranscript} />);

      expect(screen.queryByTestId('transcript-section')).not.toBeInTheDocument();
    });

    it('should handle log without summary', () => {
      const logWithoutSummary: LogWithSegments = {
        ...mockLog,
        summary: null,
      };

      render(<LogDetailView log={logWithoutSummary} />);

      expect(screen.queryByTestId('summary-section')).not.toBeInTheDocument();
    });

    it('should handle log with no todos', () => {
      const logWithoutTodos: LogWithSegments = {
        ...mockLog,
        todos: [],
      };

      render(<LogDetailView log={logWithoutTodos} />);

      expect(screen.queryByTestId('todos-section')).not.toBeInTheDocument();
    });

    it('should handle log with no ideas', () => {
      const logWithoutIdeas: LogWithSegments = {
        ...mockLog,
        ideas: [],
      };

      render(<LogDetailView log={logWithoutIdeas} />);

      expect(screen.queryByTestId('ideas-section')).not.toBeInTheDocument();
    });

    it('should handle log with no learnings', () => {
      const logWithoutLearnings: LogWithSegments = {
        ...mockLog,
        learnings: [],
      };

      render(<LogDetailView log={logWithoutLearnings} />);

      expect(screen.queryByTestId('learnings-section')).not.toBeInTheDocument();
    });

    it('should handle log with no accomplishments', () => {
      const logWithoutAccomplishments: LogWithSegments = {
        ...mockLog,
        accomplishments: [],
      };

      render(<LogDetailView log={logWithoutAccomplishments} />);

      expect(screen.queryByTestId('accomplishments-section')).not.toBeInTheDocument();
    });

    it('should handle learning without category', () => {
      const logWithLearningNoCategory: LogWithSegments = {
        ...mockLog,
        learnings: [
          {
            id: 4,
            logId: 1,
            text: 'Learned something new',
            category: null,
            createdAt: '2024-01-15T10:34:00Z',
          },
        ],
      };

      render(<LogDetailView log={logWithLearningNoCategory} />);

      const learningItem = screen.getByTestId('learning-item-4');
      expect(learningItem).toHaveTextContent('Learned something new');
      expect(learningItem).not.toHaveTextContent('Category:');
    });

    it('should handle empty log with no segments', () => {
      const emptyLog: LogWithSegments = {
        ...mockLog,
        transcript: null,
        summary: null,
        todos: [],
        ideas: [],
        learnings: [],
        accomplishments: [],
      };

      render(<LogDetailView log={emptyLog} />);

      expect(screen.getByTestId('log-detail-view')).toBeInTheDocument();
      expect(screen.getByTestId('log-metadata')).toBeInTheDocument();
      expect(screen.queryByTestId('transcript-section')).not.toBeInTheDocument();
      expect(screen.queryByTestId('todos-section')).not.toBeInTheDocument();
    });
  });
});
