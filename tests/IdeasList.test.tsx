/**
 * Tests for IdeasList Component
 * [AI-28] Build IdeasList component with status management
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { IdeasList } from '../src/renderer/components/IdeasList';
import type { Idea } from '../src/types/database';

// Mock ideas data
const mockIdeas: Idea[] = [
  {
    id: 1,
    logId: 101,
    text: 'Build a mobile app for tracking habits',
    status: 'raw',
    tags: JSON.stringify(['product', 'mobile']),
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 2,
    logId: 102,
    text: 'Explore AI-powered code review tools',
    status: 'developing',
    tags: JSON.stringify(['tech', 'AI']),
    createdAt: '2024-01-14T09:30:00Z',
    updatedAt: '2024-01-14T09:30:00Z',
  },
  {
    id: 3,
    logId: 103,
    text: 'Write blog post about TypeScript best practices',
    status: 'actionable',
    tags: null,
    createdAt: '2024-01-13T14:20:00Z',
    updatedAt: '2024-01-13T14:20:00Z',
  },
  {
    id: 4,
    logId: 104,
    text: 'Research GraphQL alternatives',
    status: 'archived',
    tags: JSON.stringify(['research']),
    createdAt: '2024-01-12T11:15:00Z',
    updatedAt: '2024-01-12T11:15:00Z',
  },
];

describe('IdeasList', () => {
  describe('Rendering', () => {
    it('should render all ideas', () => {
      render(<IdeasList ideas={mockIdeas} />);

      expect(screen.getByText('Build a mobile app for tracking habits')).toBeInTheDocument();
      expect(screen.getByText('Explore AI-powered code review tools')).toBeInTheDocument();
      expect(screen.getByText('Write blog post about TypeScript best practices')).toBeInTheDocument();
      expect(screen.getByText('Research GraphQL alternatives')).toBeInTheDocument();
    });

    it('should display idea count', () => {
      render(<IdeasList ideas={mockIdeas} />);

      expect(screen.getByText(/\(4 ideas\)/i)).toBeInTheDocument();
    });

    it('should display singular "idea" for single item', () => {
      render(<IdeasList ideas={[mockIdeas[0]]} />);

      expect(screen.getByText(/\(1 idea\)/i)).toBeInTheDocument();
    });
  });

  describe('Status Dropdown', () => {
    it('should render status dropdown for each idea', () => {
      render(<IdeasList ideas={mockIdeas} />);

      const dropdowns = screen.getAllByRole('combobox');
      expect(dropdowns).toHaveLength(4);
    });

    it('should display correct status for each idea', () => {
      render(<IdeasList ideas={mockIdeas} />);

      const dropdowns = screen.getAllByRole('combobox') as HTMLSelectElement[];
      expect(dropdowns[0].value).toBe('new'); // raw -> new
      expect(dropdowns[1].value).toBe('exploring'); // developing -> exploring
      expect(dropdowns[2].value).toBe('done'); // actionable -> done
      expect(dropdowns[3].value).toBe('parked'); // archived -> parked
    });

    it('should call onStatusChange when status is changed', () => {
      const onStatusChange = vi.fn();
      render(<IdeasList ideas={mockIdeas} onStatusChange={onStatusChange} />);

      const dropdowns = screen.getAllByRole('combobox') as HTMLSelectElement[];
      fireEvent.change(dropdowns[0], { target: { value: 'exploring' } });

      expect(onStatusChange).toHaveBeenCalledWith(1, 'developing'); // exploring -> developing
    });

    it('should disable status dropdown when onStatusChange is not provided', () => {
      render(<IdeasList ideas={mockIdeas} />);

      const dropdowns = screen.getAllByRole('combobox') as HTMLSelectElement[];
      dropdowns.forEach((dropdown) => {
        expect(dropdown).toBeDisabled();
      });
    });

    it('should have all status options available', () => {
      render(<IdeasList ideas={mockIdeas} onStatusChange={vi.fn()} />);

      const dropdown = screen.getAllByRole('combobox')[0] as HTMLSelectElement;
      const options = Array.from(dropdown.options).map((opt) => opt.value);

      expect(options).toEqual(['new', 'exploring', 'parked', 'done']);
    });
  });

  describe('Category Badge', () => {
    it('should display category badge for ideas with tags', () => {
      render(<IdeasList ideas={mockIdeas} />);

      expect(screen.getByText('product')).toBeInTheDocument();
      expect(screen.getByText('tech')).toBeInTheDocument();
      expect(screen.getByText('research')).toBeInTheDocument();
    });

    it('should show count when multiple tags exist', () => {
      render(<IdeasList ideas={mockIdeas} />);

      // First idea has 2 tags: ['product', 'mobile']
      expect(screen.getByText('product +1')).toBeInTheDocument();
      // Second idea has 2 tags: ['tech', 'AI']
      expect(screen.getByText('tech +1')).toBeInTheDocument();
    });

    it('should not display badge when tags are null', () => {
      render(<IdeasList ideas={[mockIdeas[2]]} />);

      const container = screen.getByTestId('idea-item-3');
      const badge = container.querySelector('.bg-indigo-50');
      expect(badge).not.toBeInTheDocument();
    });
  });

  describe('Source Log Link', () => {
    it('should display source log link when onViewLog is provided', () => {
      const onViewLog = vi.fn();
      render(<IdeasList ideas={mockIdeas} onViewLog={onViewLog} />);

      const links = screen.getAllByText('View source log');
      expect(links).toHaveLength(4);
    });

    it('should call onViewLog with correct logId when clicked', () => {
      const onViewLog = vi.fn();
      render(<IdeasList ideas={mockIdeas} onViewLog={onViewLog} />);

      const links = screen.getAllByText('View source log');
      fireEvent.click(links[0]);

      expect(onViewLog).toHaveBeenCalledWith(101);
    });

    it('should not display link when onViewLog is not provided', () => {
      render(<IdeasList ideas={mockIdeas} />);

      expect(screen.queryByText('View source log')).not.toBeInTheDocument();
    });
  });

  describe('Filter by Status', () => {
    it('should render all filter buttons', () => {
      render(<IdeasList ideas={mockIdeas} />);

      expect(screen.getByText('All Ideas')).toBeInTheDocument();
      expect(screen.getByText('New')).toBeInTheDocument();
      expect(screen.getByText('Exploring')).toBeInTheDocument();
      expect(screen.getByText('Parked')).toBeInTheDocument();
      expect(screen.getByText('Done')).toBeInTheDocument();
    });

    it('should show all ideas by default', () => {
      render(<IdeasList ideas={mockIdeas} />);

      expect(screen.getByText('Build a mobile app for tracking habits')).toBeInTheDocument();
      expect(screen.getByText('Explore AI-powered code review tools')).toBeInTheDocument();
      expect(screen.getByText('Write blog post about TypeScript best practices')).toBeInTheDocument();
      expect(screen.getByText('Research GraphQL alternatives')).toBeInTheDocument();
    });

    it('should filter ideas by "new" status', () => {
      render(<IdeasList ideas={mockIdeas} />);

      const newButton = screen.getByText('New');
      fireEvent.click(newButton);

      expect(screen.getByText('Build a mobile app for tracking habits')).toBeInTheDocument();
      expect(screen.queryByText('Explore AI-powered code review tools')).not.toBeInTheDocument();
      expect(screen.queryByText('Write blog post about TypeScript best practices')).not.toBeInTheDocument();
      expect(screen.queryByText('Research GraphQL alternatives')).not.toBeInTheDocument();
    });

    it('should filter ideas by "exploring" status', () => {
      render(<IdeasList ideas={mockIdeas} />);

      const exploringButton = screen.getByText('Exploring');
      fireEvent.click(exploringButton);

      expect(screen.queryByText('Build a mobile app for tracking habits')).not.toBeInTheDocument();
      expect(screen.getByText('Explore AI-powered code review tools')).toBeInTheDocument();
      expect(screen.queryByText('Write blog post about TypeScript best practices')).not.toBeInTheDocument();
      expect(screen.queryByText('Research GraphQL alternatives')).not.toBeInTheDocument();
    });

    it('should filter ideas by "done" status', () => {
      render(<IdeasList ideas={mockIdeas} />);

      const doneButton = screen.getByText('Done');
      fireEvent.click(doneButton);

      expect(screen.queryByText('Build a mobile app for tracking habits')).not.toBeInTheDocument();
      expect(screen.queryByText('Explore AI-powered code review tools')).not.toBeInTheDocument();
      expect(screen.getByText('Write blog post about TypeScript best practices')).toBeInTheDocument();
      expect(screen.queryByText('Research GraphQL alternatives')).not.toBeInTheDocument();
    });

    it('should filter ideas by "parked" status', () => {
      render(<IdeasList ideas={mockIdeas} />);

      const parkedButton = screen.getByText('Parked');
      fireEvent.click(parkedButton);

      expect(screen.queryByText('Build a mobile app for tracking habits')).not.toBeInTheDocument();
      expect(screen.queryByText('Explore AI-powered code review tools')).not.toBeInTheDocument();
      expect(screen.queryByText('Write blog post about TypeScript best practices')).not.toBeInTheDocument();
      expect(screen.getByText('Research GraphQL alternatives')).toBeInTheDocument();
    });

    it('should update filtered count when filter changes', () => {
      render(<IdeasList ideas={mockIdeas} />);

      expect(screen.getByText(/\(4 ideas\)/i)).toBeInTheDocument();

      const newButton = screen.getByText('New');
      fireEvent.click(newButton);

      expect(screen.getByText(/\(1 idea\)/i)).toBeInTheDocument();
    });

    it('should show message when no ideas match filter', () => {
      const singleIdea = [mockIdeas[0]]; // Only has 'raw' status
      render(<IdeasList ideas={singleIdea} />);

      const exploringButton = screen.getByText('Exploring');
      fireEvent.click(exploringButton);

      expect(screen.getByText('No ideas match the selected filter')).toBeInTheDocument();
    });

    it('should allow resetting filter to show all ideas', () => {
      const singleIdea = [mockIdeas[0]];
      render(<IdeasList ideas={singleIdea} />);

      const exploringButton = screen.getByText('Exploring');
      fireEvent.click(exploringButton);

      const showAllButton = screen.getByText('Show all ideas');
      fireEvent.click(showAllButton);

      expect(screen.getByText('Build a mobile app for tracking habits')).toBeInTheDocument();
    });

    it('should highlight active filter button', () => {
      render(<IdeasList ideas={mockIdeas} />);

      const newButton = screen.getByText('New');
      const allButton = screen.getByText('All Ideas');

      expect(allButton).toHaveClass('bg-blue-600', 'text-white');
      expect(newButton).not.toHaveClass('bg-blue-600');

      fireEvent.click(newButton);

      expect(newButton).toHaveClass('bg-blue-600', 'text-white');
      expect(allButton).not.toHaveClass('bg-blue-600');
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no ideas exist', () => {
      render(<IdeasList ideas={[]} />);

      expect(screen.getByText('No ideas yet')).toBeInTheDocument();
      expect(screen.getByText('Ideas from your recordings will appear here')).toBeInTheDocument();
    });

    it('should not show filter when no ideas exist', () => {
      render(<IdeasList ideas={[]} />);

      expect(screen.queryByText('All Ideas')).not.toBeInTheDocument();
      expect(screen.queryByText('New')).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator when loading', () => {
      render(<IdeasList ideas={[]} loading={true} />);

      expect(screen.getByText('Loading ideas...')).toBeInTheDocument();
    });

    it('should show spinner when loading', () => {
      const { container } = render(<IdeasList ideas={[]} loading={true} />);

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should not show ideas when loading', () => {
      render(<IdeasList ideas={mockIdeas} loading={true} />);

      expect(screen.queryByText('Build a mobile app for tracking habits')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error message when error occurs', () => {
      render(<IdeasList ideas={[]} error="Failed to load ideas from database" />);

      expect(screen.getByText('Failed to load ideas')).toBeInTheDocument();
      expect(screen.getByText('Failed to load ideas from database')).toBeInTheDocument();
    });

    it('should show retry button when onRetry is provided', () => {
      const onRetry = vi.fn();
      render(<IdeasList ideas={[]} error="Network error" onRetry={onRetry} />);

      const retryButton = screen.getByText('Retry');
      expect(retryButton).toBeInTheDocument();
    });

    it('should call onRetry when retry button is clicked', () => {
      const onRetry = vi.fn();
      render(<IdeasList ideas={[]} error="Network error" onRetry={onRetry} />);

      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should not show retry button when onRetry is not provided', () => {
      render(<IdeasList ideas={[]} error="Network error" />);

      expect(screen.queryByText('Retry')).not.toBeInTheDocument();
    });

    it('should not show ideas when error occurs', () => {
      render(<IdeasList ideas={mockIdeas} error="Database error" />);

      expect(screen.queryByText('Build a mobile app for tracking habits')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on status dropdowns', () => {
      render(<IdeasList ideas={mockIdeas} onStatusChange={vi.fn()} />);

      const firstDropdown = screen.getAllByRole('combobox')[0];
      expect(firstDropdown).toHaveAttribute('aria-label');
      expect(firstDropdown.getAttribute('aria-label')).toContain('Build a mobile app');
    });

    it('should have proper ARIA label on source log link', () => {
      render(<IdeasList ideas={mockIdeas} onViewLog={vi.fn()} />);

      const firstLink = screen.getByLabelText('View source log 101');
      expect(firstLink).toBeInTheDocument();
    });

    it('should have proper ARIA attributes on filter buttons', () => {
      render(<IdeasList ideas={mockIdeas} />);

      const allButton = screen.getByText('All Ideas');
      expect(allButton).toHaveAttribute('aria-pressed', 'true');

      const newButton = screen.getByText('New');
      expect(newButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('should have list role on ideas container', () => {
      render(<IdeasList ideas={mockIdeas} />);

      const list = screen.getByRole('list', { name: 'Ideas list' });
      expect(list).toBeInTheDocument();
    });
  });

  describe('Created Date Display', () => {
    it('should display formatted creation date', () => {
      render(<IdeasList ideas={mockIdeas} />);

      // Dates are locale-dependent, so just check that dates are present
      const container = screen.getByTestId('idea-item-1');
      expect(container).toHaveTextContent(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });
  });

  describe('Test IDs', () => {
    it('should have test IDs for each idea item', () => {
      render(<IdeasList ideas={mockIdeas} />);

      expect(screen.getByTestId('idea-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('idea-item-2')).toBeInTheDocument();
      expect(screen.getByTestId('idea-item-3')).toBeInTheDocument();
      expect(screen.getByTestId('idea-item-4')).toBeInTheDocument();
    });
  });

  describe('Visual Styling', () => {
    it('should apply correct styling based on status', () => {
      render(<IdeasList ideas={mockIdeas} />);

      const dropdowns = screen.getAllByRole('combobox');

      // Check that dropdowns have status-specific styling
      expect(dropdowns[0]).toHaveClass('text-blue-700'); // new/raw
      expect(dropdowns[1]).toHaveClass('text-purple-700'); // exploring/developing
      expect(dropdowns[2]).toHaveClass('text-green-700'); // done/actionable
      expect(dropdowns[3]).toHaveClass('text-gray-700'); // parked/archived
    });
  });
});
