/**
 * Tests for ProgressIndicator Component
 * [AI-24] Show recording status and analysis progress
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProgressIndicator } from '../src/renderer/components/ProgressIndicator';

describe('ProgressIndicator', () => {
  describe('Spinner Type', () => {
    it('should render spinner correctly', () => {
      render(<ProgressIndicator type="spinner" label="Loading content" />);

      const status = screen.getByRole('status');
      expect(status).toBeInTheDocument();
      expect(status).toHaveAttribute('aria-label', 'Loading content');

      const spinner = status.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should render different sizes', () => {
      const { rerender } = render(<ProgressIndicator type="spinner" size="sm" />);
      expect(screen.getByRole('status').querySelector('.w-4')).toBeInTheDocument();

      rerender(<ProgressIndicator type="spinner" size="md" />);
      expect(screen.getByRole('status').querySelector('.w-6')).toBeInTheDocument();

      rerender(<ProgressIndicator type="spinner" size="lg" />);
      expect(screen.getByRole('status').querySelector('.w-8')).toBeInTheDocument();
    });

    it('should render different colors', () => {
      const { rerender } = render(<ProgressIndicator type="spinner" color="blue" />);
      expect(screen.getByRole('status').querySelector('.border-blue-600')).toBeInTheDocument();

      rerender(<ProgressIndicator type="spinner" color="purple" />);
      expect(screen.getByRole('status').querySelector('.border-purple-600')).toBeInTheDocument();

      rerender(<ProgressIndicator type="spinner" color="yellow" />);
      expect(screen.getByRole('status').querySelector('.border-yellow-600')).toBeInTheDocument();

      rerender(<ProgressIndicator type="spinner" color="green" />);
      expect(screen.getByRole('status').querySelector('.border-green-600')).toBeInTheDocument();

      rerender(<ProgressIndicator type="spinner" color="red" />);
      expect(screen.getByRole('status').querySelector('.border-red-600')).toBeInTheDocument();
    });
  });

  describe('Dots Type', () => {
    it('should render dots correctly', () => {
      render(<ProgressIndicator type="dots" label="Processing" />);

      const status = screen.getByRole('status');
      expect(status).toBeInTheDocument();

      const dots = status.querySelectorAll('.animate-bounce');
      expect(dots).toHaveLength(3);
    });

    it('should render different sizes', () => {
      const { rerender } = render(<ProgressIndicator type="dots" size="sm" />);
      expect(screen.getByRole('status').querySelector('.w-1\\.5')).toBeInTheDocument();

      rerender(<ProgressIndicator type="dots" size="md" />);
      expect(screen.getByRole('status').querySelector('.w-2')).toBeInTheDocument();

      rerender(<ProgressIndicator type="dots" size="lg" />);
      expect(screen.getByRole('status').querySelector('.w-3')).toBeInTheDocument();
    });

    it('should render different colors', () => {
      const { rerender } = render(<ProgressIndicator type="dots" color="blue" />);
      expect(screen.getByRole('status').querySelector('.bg-blue-600')).toBeInTheDocument();

      rerender(<ProgressIndicator type="dots" color="purple" />);
      expect(screen.getByRole('status').querySelector('.bg-purple-600')).toBeInTheDocument();
    });

    it('should stagger animation delays', () => {
      const { container } = render(<ProgressIndicator type="dots" />);
      const dots = container.querySelectorAll('.animate-bounce');

      expect(dots[0]).toHaveStyle({ animationDelay: '0ms' });
      expect(dots[1]).toHaveStyle({ animationDelay: '150ms' });
      expect(dots[2]).toHaveStyle({ animationDelay: '300ms' });
    });
  });

  describe('Bar Type', () => {
    it('should render progress bar correctly', () => {
      render(<ProgressIndicator type="bar" progress={50} label="Uploading" />);

      const status = screen.getByRole('status');
      expect(status).toBeInTheDocument();

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute('aria-valuenow', '50');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    it('should update progress width', () => {
      const { rerender } = render(<ProgressIndicator type="bar" progress={0} />);
      let progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveStyle({ width: '0%' });

      rerender(<ProgressIndicator type="bar" progress={33} />);
      progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveStyle({ width: '33%' });

      rerender(<ProgressIndicator type="bar" progress={100} />);
      progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveStyle({ width: '100%' });
    });

    it('should clamp progress between 0 and 100', () => {
      const { rerender } = render(<ProgressIndicator type="bar" progress={-10} />);
      let progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
      expect(progressBar).toHaveStyle({ width: '0%' });

      rerender(<ProgressIndicator type="bar" progress={150} />);
      progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '100');
      expect(progressBar).toHaveStyle({ width: '100%' });
    });

    it('should handle undefined progress', () => {
      render(<ProgressIndicator type="bar" />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
      expect(progressBar).toHaveStyle({ width: '0%' });
    });

    it('should render different sizes', () => {
      const { rerender, container } = render(<ProgressIndicator type="bar" size="sm" progress={50} />);
      expect(container.querySelector('.h-1')).toBeInTheDocument();

      rerender(<ProgressIndicator type="bar" size="md" progress={50} />);
      expect(container.querySelector('.h-2')).toBeInTheDocument();

      rerender(<ProgressIndicator type="bar" size="lg" progress={50} />);
      expect(container.querySelector('.h-3')).toBeInTheDocument();
    });

    it('should render different colors', () => {
      const { rerender } = render(<ProgressIndicator type="bar" progress={50} color="blue" />);
      expect(screen.getByRole('progressbar')).toHaveClass('bg-blue-600');

      rerender(<ProgressIndicator type="bar" progress={50} color="green" />);
      expect(screen.getByRole('progressbar')).toHaveClass('bg-green-600');
    });
  });

  describe('Default Props', () => {
    it('should use default size when not specified', () => {
      render(<ProgressIndicator type="spinner" />);
      expect(screen.getByRole('status').querySelector('.w-6')).toBeInTheDocument();
    });

    it('should use default color when not specified', () => {
      render(<ProgressIndicator type="spinner" />);
      expect(screen.getByRole('status').querySelector('.border-blue-600')).toBeInTheDocument();
    });

    it('should use default label when not specified', () => {
      render(<ProgressIndicator type="spinner" />);
      expect(screen.getByLabelText('Loading')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper role for all types', () => {
      const { rerender } = render(<ProgressIndicator type="spinner" />);
      expect(screen.getByRole('status')).toBeInTheDocument();

      rerender(<ProgressIndicator type="dots" />);
      expect(screen.getByRole('status')).toBeInTheDocument();

      rerender(<ProgressIndicator type="bar" progress={50} />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should provide screen reader label', () => {
      const { rerender } = render(<ProgressIndicator type="spinner" label="Loading data" />);
      expect(screen.getByText('Loading data')).toHaveClass('sr-only');

      rerender(<ProgressIndicator type="dots" label="Processing files" />);
      expect(screen.getByText('Processing files')).toHaveClass('sr-only');

      rerender(<ProgressIndicator type="bar" progress={75} label="Uploading files" />);
      expect(screen.getByText('Uploading files')).toHaveClass('sr-only');
    });

    it('should have progressbar role with proper attributes for bar type', () => {
      render(<ProgressIndicator type="bar" progress={60} />);
      const progressBar = screen.getByRole('progressbar');

      expect(progressBar).toHaveAttribute('aria-valuenow', '60');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });
  });

  describe('Visual Styles', () => {
    it('should apply transition classes for smooth updates', () => {
      render(<ProgressIndicator type="bar" progress={50} />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveClass('transition-all', 'duration-300', 'ease-out');
    });

    it('should have rounded corners', () => {
      const { container } = render(<ProgressIndicator type="spinner" />);
      expect(container.querySelector('.rounded-full')).toBeInTheDocument();
    });
  });
});
