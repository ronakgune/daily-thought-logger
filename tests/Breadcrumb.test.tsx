/**
 * Tests for Breadcrumb Component
 * AI-32: Add item-to-log traceability links
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Breadcrumb } from '../src/renderer/components/Breadcrumb';
import type { BreadcrumbItem } from '../src/renderer/components/Breadcrumb';

describe('Breadcrumb', () => {
  describe('Rendering', () => {
    it('should render breadcrumb navigation', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home' },
        { label: 'Logs' },
        { label: 'Log Detail' },
      ];

      render(<Breadcrumb items={items} />);

      expect(screen.getByTestId('breadcrumb')).toBeInTheDocument();
      expect(screen.getByLabelText('Breadcrumb')).toBeInTheDocument();
    });

    it('should render all breadcrumb items', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home' },
        { label: 'Logs' },
        { label: 'Log Detail' },
      ];

      render(<Breadcrumb items={items} />);

      expect(screen.getByTestId('breadcrumb-item-0')).toBeInTheDocument();
      expect(screen.getByTestId('breadcrumb-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('breadcrumb-item-2')).toBeInTheDocument();
    });

    it('should display correct labels', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home' },
        { label: 'Todos' },
        { label: 'Todo #123' },
      ];

      render(<Breadcrumb items={items} />);

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Todos')).toBeInTheDocument();
      expect(screen.getByText('Todo #123')).toBeInTheDocument();
    });

    it('should render clickable links for non-active items with onClick', () => {
      const mockOnClick = vi.fn();
      const items: BreadcrumbItem[] = [
        { label: 'Home', onClick: mockOnClick },
        { label: 'Current Page' },
      ];

      render(<Breadcrumb items={items} />);

      expect(screen.getByTestId('breadcrumb-link-0')).toBeInTheDocument();
      expect(screen.queryByTestId('breadcrumb-link-1')).not.toBeInTheDocument();
      expect(screen.getByTestId('breadcrumb-text-1')).toBeInTheDocument();
    });

    it('should render separators between items', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home' },
        { label: 'Logs' },
        { label: 'Detail' },
      ];

      render(<Breadcrumb items={items} />);

      expect(screen.getByTestId('breadcrumb-separator-0')).toBeInTheDocument();
      expect(screen.getByTestId('breadcrumb-separator-1')).toBeInTheDocument();
      expect(screen.queryByTestId('breadcrumb-separator-2')).not.toBeInTheDocument();
    });

    it('should use default separator /', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home' },
        { label: 'Logs' },
      ];

      render(<Breadcrumb items={items} />);

      const separator = screen.getByTestId('breadcrumb-separator-0');
      expect(separator).toHaveTextContent('/');
    });

    it('should use custom separator when provided', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home' },
        { label: 'Logs' },
      ];

      render(<Breadcrumb items={items} separator=">" />);

      const separator = screen.getByTestId('breadcrumb-separator-0');
      expect(separator).toHaveTextContent('>');
    });

    it('should apply custom className', () => {
      const items: BreadcrumbItem[] = [{ label: 'Home' }];

      render(<Breadcrumb items={items} className="custom-breadcrumb" />);

      const breadcrumb = screen.getByTestId('breadcrumb');
      expect(breadcrumb).toHaveClass('custom-breadcrumb');
    });
  });

  describe('Active State', () => {
    it('should mark last item as active by default', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home' },
        { label: 'Logs' },
        { label: 'Detail' },
      ];

      render(<Breadcrumb items={items} />);

      const lastItem = screen.getByTestId('breadcrumb-item-2');
      expect(lastItem).toHaveClass('active');
    });

    it('should respect explicit isActive flag', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home' },
        { label: 'Logs', isActive: true },
        { label: 'Detail' },
      ];

      render(<Breadcrumb items={items} />);

      const item1 = screen.getByTestId('breadcrumb-item-1');
      expect(item1).toHaveClass('active');
    });

    it('should set aria-current="page" on active items', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home' },
        { label: 'Current' },
      ];

      render(<Breadcrumb items={items} />);

      const currentText = screen.getByTestId('breadcrumb-text-1');
      expect(currentText).toHaveAttribute('aria-current', 'page');
    });

    it('should not set aria-current on non-active items', () => {
      const mockOnClick = vi.fn();
      const items: BreadcrumbItem[] = [
        { label: 'Home', onClick: mockOnClick },
        { label: 'Current' },
      ];

      render(<Breadcrumb items={items} />);

      const homeLink = screen.getByTestId('breadcrumb-link-0');
      expect(homeLink).not.toHaveAttribute('aria-current');
    });
  });

  describe('Interactions', () => {
    it('should call onClick when breadcrumb link is clicked', () => {
      const mockOnClick = vi.fn();
      const items: BreadcrumbItem[] = [
        { label: 'Home', onClick: mockOnClick },
        { label: 'Current' },
      ];

      render(<Breadcrumb items={items} />);

      const link = screen.getByTestId('breadcrumb-link-0');
      fireEvent.click(link);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick for active items', () => {
      const mockOnClick = vi.fn();
      const items: BreadcrumbItem[] = [
        { label: 'Home' },
        { label: 'Current', onClick: mockOnClick, isActive: true },
      ];

      render(<Breadcrumb items={items} />);

      // Active item should not render as a button
      expect(screen.queryByTestId('breadcrumb-link-1')).not.toBeInTheDocument();
      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it('should handle multiple breadcrumb clicks', () => {
      const mockOnClick1 = vi.fn();
      const mockOnClick2 = vi.fn();
      const items: BreadcrumbItem[] = [
        { label: 'Home', onClick: mockOnClick1 },
        { label: 'Logs', onClick: mockOnClick2 },
        { label: 'Detail' },
      ];

      render(<Breadcrumb items={items} />);

      const link1 = screen.getByTestId('breadcrumb-link-0');
      const link2 = screen.getByTestId('breadcrumb-link-1');

      fireEvent.click(link1);
      expect(mockOnClick1).toHaveBeenCalledTimes(1);
      expect(mockOnClick2).not.toHaveBeenCalled();

      fireEvent.click(link2);
      expect(mockOnClick1).toHaveBeenCalledTimes(1);
      expect(mockOnClick2).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single item breadcrumb', () => {
      const items: BreadcrumbItem[] = [{ label: 'Home' }];

      render(<Breadcrumb items={items} />);

      expect(screen.getByTestId('breadcrumb-item-0')).toBeInTheDocument();
      expect(screen.queryByTestId('breadcrumb-separator-0')).not.toBeInTheDocument();
      expect(screen.getByTestId('breadcrumb-item-0')).toHaveClass('active');
    });

    it('should handle empty items array', () => {
      const items: BreadcrumbItem[] = [];

      render(<Breadcrumb items={items} />);

      expect(screen.getByTestId('breadcrumb')).toBeInTheDocument();
      expect(screen.queryByTestId('breadcrumb-item-0')).not.toBeInTheDocument();
    });

    it('should handle items with very long labels', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home' },
        {
          label:
            'This is a very long breadcrumb label that might cause layout issues if not handled properly',
        },
      ];

      render(<Breadcrumb items={items} />);

      expect(screen.getByText(/very long breadcrumb label/)).toBeInTheDocument();
    });

    it('should handle items without onClick callbacks', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home' },
        { label: 'Logs' },
        { label: 'Detail' },
      ];

      render(<Breadcrumb items={items} />);

      // All items should render as text, not links (except possibly last which is active)
      expect(screen.queryByTestId('breadcrumb-link-0')).not.toBeInTheDocument();
      expect(screen.queryByTestId('breadcrumb-link-1')).not.toBeInTheDocument();
      expect(screen.getByTestId('breadcrumb-text-0')).toBeInTheDocument();
      expect(screen.getByTestId('breadcrumb-text-1')).toBeInTheDocument();
    });

    it('should handle special characters in labels', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home & Settings' },
        { label: 'Log <2024>' },
        { label: 'Item "Test"' },
      ];

      render(<Breadcrumb items={items} />);

      expect(screen.getByText('Home & Settings')).toBeInTheDocument();
      expect(screen.getByText('Log <2024>')).toBeInTheDocument();
      expect(screen.getByText('Item "Test"')).toBeInTheDocument();
    });

    it('should maintain separator aria-hidden attribute', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home' },
        { label: 'Logs' },
      ];

      render(<Breadcrumb items={items} />);

      const separator = screen.getByTestId('breadcrumb-separator-0');
      expect(separator).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA navigation role', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home' },
        { label: 'Current' },
      ];

      render(<Breadcrumb items={items} />);

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Breadcrumb');
    });

    it('should use semantic HTML list structure', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home' },
        { label: 'Logs' },
        { label: 'Detail' },
      ];

      render(<Breadcrumb items={items} />);

      const breadcrumb = screen.getByTestId('breadcrumb');
      const list = breadcrumb.querySelector('ol');
      expect(list).toBeInTheDocument();
      expect(list?.className).toContain('breadcrumb-list');
    });
  });
});
