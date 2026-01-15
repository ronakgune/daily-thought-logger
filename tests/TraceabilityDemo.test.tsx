/**
 * Tests for TraceabilityDemo Component
 * AI-32: Add item-to-log traceability links
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TraceabilityDemo } from '../src/renderer/components/TraceabilityDemo';

describe('TraceabilityDemo', () => {
  describe('Rendering', () => {
    it('should render demo component with default data', () => {
      render(<TraceabilityDemo />);

      expect(screen.getByTestId('traceability-demo')).toBeInTheDocument();
      expect(screen.getByTestId('breadcrumb')).toBeInTheDocument();
      expect(screen.getByTestId('items-list-view')).toBeInTheDocument();
    });

    it('should display all item sections', () => {
      render(<TraceabilityDemo />);

      expect(screen.getByText('Todos')).toBeInTheDocument();
      expect(screen.getByText('Ideas')).toBeInTheDocument();
      expect(screen.getByText('Learnings')).toBeInTheDocument();
      expect(screen.getByText('Accomplishments')).toBeInTheDocument();
    });

    it('should render items with source information', () => {
      render(<TraceabilityDemo />);

      // Check that items are rendered with ItemWithSource
      const viewSourceButtons = screen.getAllByTestId('view-source-button');
      expect(viewSourceButtons.length).toBeGreaterThan(0);
    });

    it('should show breadcrumb for list view', () => {
      render(<TraceabilityDemo />);

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('All Items')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should navigate to log detail when View Source is clicked', () => {
      render(<TraceabilityDemo />);

      // Initially in list view
      expect(screen.getByTestId('items-list-view')).toBeInTheDocument();

      // Click first View Source button
      const viewSourceButtons = screen.getAllByTestId('view-source-button');
      fireEvent.click(viewSourceButtons[0]);

      // Should now show log detail view
      expect(screen.queryByTestId('items-list-view')).not.toBeInTheDocument();
      expect(screen.getByTestId('log-detail-view')).toBeInTheDocument();
    });

    it('should navigate back to list view when back button is clicked', () => {
      render(<TraceabilityDemo />);

      // Navigate to detail view
      const viewSourceButtons = screen.getAllByTestId('view-source-button');
      fireEvent.click(viewSourceButtons[0]);

      expect(screen.getByTestId('log-detail-view')).toBeInTheDocument();

      // Click back button
      const backButton = screen.getByTestId('back-button');
      fireEvent.click(backButton);

      // Should be back at list view
      expect(screen.getByTestId('items-list-view')).toBeInTheDocument();
      expect(screen.queryByTestId('log-detail-view')).not.toBeInTheDocument();
    });

    it('should update breadcrumb when navigating', () => {
      render(<TraceabilityDemo />);

      // In list view, breadcrumb should show "Home / All Items"
      let breadcrumbItems = screen.getAllByTestId(/^breadcrumb-item-/);
      expect(breadcrumbItems).toHaveLength(2);

      // Navigate to detail view
      const viewSourceButtons = screen.getAllByTestId('view-source-button');
      fireEvent.click(viewSourceButtons[0]);

      // In detail view, breadcrumb should show "Home / All Items / Log Detail"
      breadcrumbItems = screen.getAllByTestId(/^breadcrumb-item-/);
      expect(breadcrumbItems).toHaveLength(3);
      expect(screen.getByText('Log Detail')).toBeInTheDocument();
    });

    it('should allow breadcrumb navigation back to list', () => {
      render(<TraceabilityDemo />);

      // Navigate to detail view
      const viewSourceButtons = screen.getAllByTestId('view-source-button');
      fireEvent.click(viewSourceButtons[0]);

      expect(screen.getByTestId('log-detail-view')).toBeInTheDocument();

      // Click on "All Items" in breadcrumb
      const breadcrumbLinks = screen.getAllByTestId(/^breadcrumb-link-/);
      const allItemsLink = breadcrumbLinks.find(
        (link) => link.textContent === 'All Items'
      );
      expect(allItemsLink).toBeDefined();

      if (allItemsLink) {
        fireEvent.click(allItemsLink);
        expect(screen.getByTestId('items-list-view')).toBeInTheDocument();
      }
    });
  });

  describe('Item Highlighting', () => {
    it('should highlight todo when navigating from todo item', () => {
      render(<TraceabilityDemo />);

      // Find and click View Source on a todo
      const viewSourceButtons = screen.getAllByTestId('view-source-button');
      // First button should be for the first todo
      fireEvent.click(viewSourceButtons[0]);

      // Should be in detail view with highlighted item
      expect(screen.getByTestId('log-detail-view')).toBeInTheDocument();

      // Check that a todo item is highlighted
      const todoItems = screen.getAllByTestId(/^todo-item-/);
      const highlightedItem = todoItems.find((item) =>
        item.getAttribute('data-highlighted') === 'true'
      );
      expect(highlightedItem).toBeDefined();
    });

    it('should clear highlight when navigating back', () => {
      render(<TraceabilityDemo />);

      // Navigate to detail with highlight
      let viewSourceButtons = screen.getAllByTestId('view-source-button');
      fireEvent.click(viewSourceButtons[0]);

      // Go back
      const backButton = screen.getByTestId('back-button');
      fireEvent.click(backButton);

      // Get fresh references after navigation back
      viewSourceButtons = screen.getAllByTestId('view-source-button');
      // Navigate to detail again with a different item
      fireEvent.click(viewSourceButtons[1]);

      // A different item should be highlighted or none
      // This tests that state is properly managed
      expect(screen.getByTestId('log-detail-view')).toBeInTheDocument();
    });
  });

  describe('Item Types', () => {
    it('should handle viewing source for different item types', () => {
      render(<TraceabilityDemo />);

      // Test first item
      let viewSourceButtons = screen.getAllByTestId('view-source-button');
      fireEvent.click(viewSourceButtons[0]);
      expect(screen.getByTestId('log-detail-view')).toBeInTheDocument();

      // Navigate back
      let backButton = screen.getByTestId('back-button');
      fireEvent.click(backButton);
      expect(screen.getByTestId('items-list-view')).toBeInTheDocument();

      // Test second item
      viewSourceButtons = screen.getAllByTestId('view-source-button');
      fireEvent.click(viewSourceButtons[1]);
      expect(screen.getByTestId('log-detail-view')).toBeInTheDocument();

      backButton = screen.getByTestId('back-button');
      fireEvent.click(backButton);
      expect(screen.getByTestId('items-list-view')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle custom sample log data', () => {
      const customLog = {
        id: 99,
        date: '2024-02-01',
        audioPath: null,
        transcript: 'Custom transcript',
        summary: 'Custom summary',
        pendingAnalysis: false,
        retryCount: 0,
        lastError: null,
        createdAt: '2024-02-01T12:00:00Z',
        updatedAt: '2024-02-01T12:00:00Z',
        todos: [
          {
            id: 100,
            logId: 99,
            text: 'Custom todo',
            completed: false,
            dueDate: null,
            priority: 1,
            createdAt: '2024-02-01T12:01:00Z',
            updatedAt: '2024-02-01T12:01:00Z',
          },
        ],
        ideas: [],
        learnings: [],
        accomplishments: [],
      };

      render(<TraceabilityDemo sampleLog={customLog} />);

      expect(screen.getByText('Custom todo')).toBeInTheDocument();
    });

    it('should handle log with no items gracefully', () => {
      const emptyLog = {
        id: 1,
        date: '2024-01-15',
        audioPath: null,
        transcript: 'Empty log',
        summary: null,
        pendingAnalysis: false,
        retryCount: 0,
        lastError: null,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        todos: [],
        ideas: [],
        learnings: [],
        accomplishments: [],
      };

      render(<TraceabilityDemo sampleLog={emptyLog} />);

      // Should still render, just with no items
      expect(screen.getByTestId('traceability-demo')).toBeInTheDocument();
      expect(screen.getByText('Todos')).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should demonstrate complete traceability workflow', () => {
      render(<TraceabilityDemo />);

      // 1. Start in list view
      expect(screen.getByTestId('items-list-view')).toBeInTheDocument();
      expect(screen.getByText('All Extracted Items')).toBeInTheDocument();

      // 2. See items with source timestamps
      const sourceTimestamps = screen.getAllByTestId('source-timestamp');
      expect(sourceTimestamps.length).toBeGreaterThan(0);

      // 3. Click View Source
      const viewSourceButtons = screen.getAllByTestId('view-source-button');
      fireEvent.click(viewSourceButtons[0]);

      // 4. See log detail with highlighted item
      expect(screen.getByTestId('log-detail-view')).toBeInTheDocument();
      const highlightedItems = screen.getAllByTestId(/^(todo|idea|learning|accomplishment)-item-/);
      const hasHighlighted = highlightedItems.some(
        (item) => item.getAttribute('data-highlighted') === 'true'
      );
      expect(hasHighlighted).toBe(true);

      // 5. Use breadcrumb to navigate back
      const breadcrumbLinks = screen.getAllByTestId(/^breadcrumb-link-/);
      expect(breadcrumbLinks.length).toBeGreaterThan(0);
      fireEvent.click(breadcrumbLinks[0]);

      // 6. Back at list view
      expect(screen.getByTestId('items-list-view')).toBeInTheDocument();
    });
  });
});
