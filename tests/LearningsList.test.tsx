/**
 * Tests for LearningsList Component
 * [AI-29] Build LearningsList component
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LearningsList } from '../src/renderer/components/LearningsList';
import type { LearningWithLog } from '../src/renderer/components/LearningsList';

// Sample test data
const mockLearnings: LearningWithLog[] = [
  {
    id: 1,
    logId: 10,
    text: 'React hooks allow functional components to manage state',
    category: 'Programming',
    createdAt: '2024-01-15T10:00:00Z',
    logDate: '2024-01-15',
  },
  {
    id: 2,
    logId: 11,
    text: 'TypeScript improves code quality through type safety',
    category: 'Programming',
    createdAt: '2024-01-16T14:30:00Z',
    logDate: '2024-01-16',
  },
  {
    id: 3,
    logId: 12,
    text: 'Regular exercise improves mental clarity',
    category: 'Health',
    createdAt: '2024-01-17T09:00:00Z',
    logDate: '2024-01-17',
  },
  {
    id: 4,
    logId: 13,
    text: 'Deep work requires uninterrupted focus time',
    category: 'Productivity',
    createdAt: '2024-01-18T11:00:00Z',
    logDate: '2024-01-18',
  },
  {
    id: 5,
    logId: 14,
    text: 'Learning without a category',
    category: null,
    createdAt: '2024-01-19T12:00:00Z',
    logDate: '2024-01-19',
  },
];

describe('LearningsList', () => {
  describe('Loading State', () => {
    it('should display loading spinner when isLoading is true', () => {
      render(<LearningsList learnings={[]} isLoading={true} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Loading learnings...')).toBeInTheDocument();
    });

    it('should show spinner animation', () => {
      const { container } = render(<LearningsList learnings={[]} isLoading={true} />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when error prop is provided', () => {
      render(<LearningsList learnings={[]} error="Failed to load learnings" />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Error loading learnings')).toBeInTheDocument();
      expect(screen.getByText('Failed to load learnings')).toBeInTheDocument();
    });

    it('should have proper accessibility attributes', () => {
      render(<LearningsList learnings={[]} error="Test error" />);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'assertive');
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no learnings', () => {
      render(<LearningsList learnings={[]} />);

      expect(screen.getByText('No learnings yet')).toBeInTheDocument();
      expect(
        screen.getByText('Learnings will appear here as you record and analyze your thoughts.')
      ).toBeInTheDocument();
    });

    it('should show lightbulb icon in empty state', () => {
      const { container } = render(<LearningsList learnings={[]} />);
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Learnings Display', () => {
    it('should render all learnings', () => {
      render(<LearningsList learnings={mockLearnings} />);

      const items = screen.getAllByTestId('learning-item');
      expect(items).toHaveLength(5);
    });

    it('should display learning text correctly', () => {
      render(<LearningsList learnings={mockLearnings} />);

      expect(screen.getByText('React hooks allow functional components to manage state')).toBeInTheDocument();
      expect(screen.getByText('TypeScript improves code quality through type safety')).toBeInTheDocument();
    });

    it('should display category badges', () => {
      render(<LearningsList learnings={mockLearnings} />);

      const badges = screen.getAllByTestId('category-badge');
      expect(badges).toHaveLength(4); // 5 learnings, but 1 has no category

      expect(screen.getAllByText('Programming')).toHaveLength(2);
      expect(screen.getByText('Health')).toBeInTheDocument();
      expect(screen.getByText('Productivity')).toBeInTheDocument();
    });

    it('should display dates', () => {
      render(<LearningsList learnings={mockLearnings} />);

      const dates = screen.getAllByTestId('learning-date');
      expect(dates.length).toBeGreaterThan(0);
    });

    it('should display total count', () => {
      render(<LearningsList learnings={mockLearnings} />);

      expect(screen.getByText('5 learnings total')).toBeInTheDocument();
    });

    it('should use singular form for single learning', () => {
      render(<LearningsList learnings={[mockLearnings[0]]} />);

      expect(screen.getByText('1 learning total')).toBeInTheDocument();
    });
  });

  describe('View Log Functionality', () => {
    it('should render view log buttons when onViewLog callback is provided', () => {
      const onViewLog = vi.fn();
      render(<LearningsList learnings={mockLearnings} onViewLog={onViewLog} />);

      const buttons = screen.getAllByTestId('view-log-button');
      expect(buttons).toHaveLength(5);
    });

    it('should call onViewLog with correct logId when button is clicked', () => {
      const onViewLog = vi.fn();
      render(<LearningsList learnings={mockLearnings} onViewLog={onViewLog} />);

      const buttons = screen.getAllByTestId('view-log-button');
      fireEvent.click(buttons[0]);

      expect(onViewLog).toHaveBeenCalledWith(10);
      expect(onViewLog).toHaveBeenCalledTimes(1);
    });

    it('should not render view log buttons when onViewLog is not provided', () => {
      render(<LearningsList learnings={mockLearnings} />);

      const buttons = screen.queryAllByTestId('view-log-button');
      expect(buttons).toHaveLength(0);
    });

    it('should have proper accessibility labels', () => {
      const onViewLog = vi.fn();
      render(<LearningsList learnings={mockLearnings} onViewLog={onViewLog} />);

      const button = screen.getAllByTestId('view-log-button')[0];
      expect(button).toHaveAttribute(
        'aria-label',
        'View source log for learning: React hooks allow functional components to manage state'
      );
    });
  });

  describe('Category Filtering', () => {
    it('should display category filter dropdown', () => {
      render(<LearningsList learnings={mockLearnings} showFilter={true} />);

      expect(screen.getByTestId('category-filter')).toBeInTheDocument();
    });

    it('should list all unique categories in dropdown', () => {
      render(<LearningsList learnings={mockLearnings} showFilter={true} />);

      const select = screen.getByTestId('category-filter') as HTMLSelectElement;
      const options = Array.from(select.options).map((opt) => opt.value);

      expect(options).toContain('');
      expect(options).toContain('Programming');
      expect(options).toContain('Health');
      expect(options).toContain('Productivity');
    });

    it('should filter learnings when category is selected', () => {
      render(<LearningsList learnings={mockLearnings} showFilter={true} />);

      const select = screen.getByTestId('category-filter');
      fireEvent.change(select, { target: { value: 'Programming' } });

      const items = screen.getAllByTestId('learning-item');
      expect(items).toHaveLength(2);

      expect(screen.getByText('React hooks allow functional components to manage state')).toBeInTheDocument();
      expect(screen.getByText('TypeScript improves code quality through type safety')).toBeInTheDocument();
    });

    it('should show all learnings when "All categories" is selected', () => {
      render(<LearningsList learnings={mockLearnings} showFilter={true} />);

      const select = screen.getByTestId('category-filter');

      // First filter
      fireEvent.change(select, { target: { value: 'Health' } });
      expect(screen.getAllByTestId('learning-item')).toHaveLength(1);

      // Reset to all
      fireEvent.change(select, { target: { value: '' } });
      expect(screen.getAllByTestId('learning-item')).toHaveLength(5);
    });

    it('should display count for each category in dropdown', () => {
      render(<LearningsList learnings={mockLearnings} showFilter={true} />);

      const select = screen.getByTestId('category-filter');
      const programmingOption = Array.from(select.options).find((opt) =>
        opt.textContent?.includes('Programming')
      );

      expect(programmingOption?.textContent).toContain('(2)');
    });

    it('should hide filter when showFilter is false', () => {
      render(<LearningsList learnings={mockLearnings} showFilter={false} />);

      expect(screen.queryByTestId('filter-controls')).not.toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should display search input', () => {
      render(<LearningsList learnings={mockLearnings} showFilter={true} />);

      expect(screen.getByTestId('search-input')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search learnings...')).toBeInTheDocument();
    });

    it('should filter learnings by text content', () => {
      render(<LearningsList learnings={mockLearnings} showFilter={true} />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'TypeScript' } });

      const items = screen.getAllByTestId('learning-item');
      expect(items).toHaveLength(1);
      expect(screen.getByText('TypeScript improves code quality through type safety')).toBeInTheDocument();
    });

    it('should be case-insensitive', () => {
      render(<LearningsList learnings={mockLearnings} showFilter={true} />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'REACT' } });

      expect(screen.getAllByTestId('learning-item')).toHaveLength(1);
    });

    it('should filter by category name', () => {
      render(<LearningsList learnings={mockLearnings} showFilter={true} />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'Health' } });

      expect(screen.getAllByTestId('learning-item')).toHaveLength(1);
      expect(screen.getByText('Regular exercise improves mental clarity')).toBeInTheDocument();
    });

    it('should combine search and category filters', () => {
      render(<LearningsList learnings={mockLearnings} showFilter={true} />);

      const searchInput = screen.getByTestId('search-input');
      const categorySelect = screen.getByTestId('category-filter');

      fireEvent.change(categorySelect, { target: { value: 'Programming' } });
      fireEvent.change(searchInput, { target: { value: 'TypeScript' } });

      const items = screen.getAllByTestId('learning-item');
      expect(items).toHaveLength(1);
      expect(screen.getByText('TypeScript improves code quality through type safety')).toBeInTheDocument();
    });
  });

  describe('Clear Filters', () => {
    it('should display clear filters button when filters are active', () => {
      render(<LearningsList learnings={mockLearnings} showFilter={true} />);

      const select = screen.getByTestId('category-filter');
      fireEvent.change(select, { target: { value: 'Programming' } });

      expect(screen.getByTestId('clear-filters-button')).toBeInTheDocument();
    });

    it('should clear all filters when clear button is clicked', () => {
      render(<LearningsList learnings={mockLearnings} showFilter={true} />);

      const searchInput = screen.getByTestId('search-input');
      const categorySelect = screen.getByTestId('category-filter');

      // Apply filters
      fireEvent.change(searchInput, { target: { value: 'React' } });
      fireEvent.change(categorySelect, { target: { value: 'Programming' } });

      // Click clear
      const clearButton = screen.getByTestId('clear-filters-button');
      fireEvent.click(clearButton);

      // Check filters are cleared
      expect(searchInput).toHaveValue('');
      expect(categorySelect).toHaveValue('');
      expect(screen.getAllByTestId('learning-item')).toHaveLength(5);
    });

    it('should show filtered count when filters are active', () => {
      render(<LearningsList learnings={mockLearnings} showFilter={true} />);

      const select = screen.getByTestId('category-filter');
      fireEvent.change(select, { target: { value: 'Programming' } });

      const countElements = screen.getAllByText('Showing 2 of 5 learnings');
      expect(countElements.length).toBeGreaterThan(0);
    });
  });

  describe('No Results State', () => {
    it('should display no results message when filters yield no results', () => {
      render(<LearningsList learnings={mockLearnings} showFilter={true} />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      expect(screen.getByText('No learnings match your filters')).toBeInTheDocument();
    });

    it('should show clear filters button in no results state', () => {
      render(<LearningsList learnings={mockLearnings} showFilter={true} />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      const clearButton = screen.getByText('Clear filters');
      expect(clearButton).toBeInTheDocument();

      fireEvent.click(clearButton);
      expect(screen.getAllByTestId('learning-item')).toHaveLength(5);
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic HTML structure', () => {
      render(<LearningsList learnings={mockLearnings} />);

      expect(screen.getByRole('list', { name: 'Learnings list' })).toBeInTheDocument();
    });

    it('should have accessible labels for inputs', () => {
      render(<LearningsList learnings={mockLearnings} showFilter={true} />);

      expect(screen.getByLabelText('Search learnings')).toBeInTheDocument();
      expect(screen.getByLabelText('Filter by category')).toBeInTheDocument();
    });

    it('should have keyboard navigation support', () => {
      const onViewLog = vi.fn();
      render(<LearningsList learnings={mockLearnings} onViewLog={onViewLog} />);

      const button = screen.getAllByTestId('view-log-button')[0];
      button.focus();
      expect(button).toHaveFocus();
    });

    it('should have focus ring styles', () => {
      const onViewLog = vi.fn();
      render(<LearningsList learnings={mockLearnings} onViewLog={onViewLog} />);

      const button = screen.getAllByTestId('view-log-button')[0];
      expect(button).toHaveClass('focus:outline-none', 'focus:ring-2');
    });
  });

  describe('Visual Styling', () => {
    it('should apply hover effects to learning items', () => {
      render(<LearningsList learnings={mockLearnings} />);

      const item = screen.getAllByTestId('learning-item')[0];
      expect(item).toHaveClass('hover:shadow-md', 'hover:border-blue-300');
    });

    it('should have transition animations', () => {
      render(<LearningsList learnings={mockLearnings} />);

      const item = screen.getAllByTestId('learning-item')[0];
      expect(item).toHaveClass('transition-all', 'duration-200');
    });

    it('should apply consistent color coding to categories', () => {
      const { rerender } = render(<LearningsList learnings={mockLearnings} />);

      const programmingBadges = screen.getAllByText('Programming');
      const firstColor = programmingBadges[0].className;

      // Rerender and check colors are consistent
      rerender(<LearningsList learnings={mockLearnings} />);
      const programmingBadgesAfter = screen.getAllByText('Programming');

      expect(programmingBadgesAfter[0].className).toBe(firstColor);
      expect(programmingBadgesAfter[1].className).toBe(firstColor);
    });
  });

  describe('Edge Cases', () => {
    it('should handle learnings without category', () => {
      const learningWithoutCategory: LearningWithLog[] = [
        {
          id: 1,
          logId: 1,
          text: 'A learning without category',
          category: null,
          createdAt: '2024-01-15T10:00:00Z',
        },
      ];

      render(<LearningsList learnings={learningWithoutCategory} />);

      expect(screen.getByTestId('learning-item')).toBeInTheDocument();
      expect(screen.queryByTestId('category-badge')).not.toBeInTheDocument();
    });

    it('should handle invalid dates gracefully', () => {
      const learningWithInvalidDate: LearningWithLog[] = [
        {
          id: 1,
          logId: 1,
          text: 'A learning',
          category: 'Test',
          createdAt: 'invalid-date',
          logDate: 'also-invalid',
        },
      ];

      render(<LearningsList learnings={learningWithInvalidDate} />);

      expect(screen.getByTestId('learning-item')).toBeInTheDocument();
    });

    it('should handle very long learning text', () => {
      const longText = 'A'.repeat(1000);
      const learningWithLongText: LearningWithLog[] = [
        {
          id: 1,
          logId: 1,
          text: longText,
          category: 'Test',
          createdAt: '2024-01-15T10:00:00Z',
        },
      ];

      render(<LearningsList learnings={learningWithLongText} />);

      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('should handle special characters in search', () => {
      render(<LearningsList learnings={mockLearnings} showFilter={true} />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: '()[]{}' } });

      // Should not crash, just show no results
      expect(screen.getByText('No learnings match your filters')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should handle large number of learnings', () => {
      const manyLearnings: LearningWithLog[] = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        logId: i,
        text: `Learning ${i}`,
        category: `Category ${i % 5}`,
        createdAt: new Date(2024, 0, i + 1).toISOString(),
      }));

      render(<LearningsList learnings={manyLearnings} />);

      expect(screen.getAllByTestId('learning-item')).toHaveLength(100);
    });

    it('should maintain filter state during re-renders', () => {
      const { rerender } = render(<LearningsList learnings={mockLearnings} showFilter={true} />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'React' } });

      // Rerender with same props
      rerender(<LearningsList learnings={mockLearnings} showFilter={true} />);

      expect(searchInput).toHaveValue('React');
      expect(screen.getAllByTestId('learning-item')).toHaveLength(1);
    });
  });
});
