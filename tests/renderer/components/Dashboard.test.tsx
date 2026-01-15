/**
 * Dashboard Component Tests
 * AI-25: Dashboard view tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Dashboard } from '../../../src/renderer/components/Dashboard';

describe('Dashboard', () => {
  const mockStats = {
    totalLogs: 23,
    todayLogs: 2,
    pendingTodos: 5,
    totalIdeas: 12,
  };

  const mockRecentLogs = [
    {
      id: 1,
      date: 'Today at 2:30 PM',
      preview: 'First recent log preview',
    },
    {
      id: 2,
      date: 'Today at 10:15 AM',
      preview: 'Second recent log preview',
    },
  ];

  it('renders dashboard header', () => {
    render(<Dashboard />);
    expect(screen.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeInTheDocument();
    expect(screen.getByText("Welcome back! Here's your overview.")).toBeInTheDocument();
  });

  it('renders all stat cards with default values', () => {
    render(<Dashboard />);

    expect(screen.getByText('Total Logs')).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Pending Todos')).toBeInTheDocument();
    expect(screen.getByText('Ideas')).toBeInTheDocument();
  });

  it('displays provided stats', () => {
    const { container } = render(<Dashboard stats={mockStats} />);

    // Check that stat values are displayed somewhere
    expect(container.textContent).toContain('23');
    expect(container.textContent).toContain('2');
    expect(container.textContent).toContain('5');
    expect(container.textContent).toContain('12');
  });

  it('shows empty state when no recent logs', () => {
    const { container } = render(<Dashboard recentLogs={[]} />);

    expect(screen.getByText('No logs yet')).toBeInTheDocument();
    expect(screen.getByText(/Start by recording your first thought/)).toBeInTheDocument();
    expect(container.textContent).toContain('Cmd+Shift+Space');
  });

  it('displays recent logs when provided', () => {
    render(<Dashboard recentLogs={mockRecentLogs} />);

    expect(screen.getByText('First recent log preview')).toBeInTheDocument();
    expect(screen.getByText('Today at 2:30 PM')).toBeInTheDocument();

    expect(screen.getByText('Second recent log preview')).toBeInTheDocument();
    expect(screen.getByText('Today at 10:15 AM')).toBeInTheDocument();
  });

  it('renders recent activity section', () => {
    render(<Dashboard />);
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
  });

  it('renders quick actions section', () => {
    const { container } = render(<Dashboard />);
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(container.textContent).toContain('View All Logs');
    expect(container.textContent).toContain('Manage Todos');
    expect(container.textContent).toContain('Browse Ideas');
  });

  it('renders getting started section', () => {
    const { container } = render(<Dashboard />);
    expect(screen.getByText('Getting Started')).toBeInTheDocument();
    expect(container.textContent).toContain('Cmd+Shift+Space');
    expect(container.textContent).toContain('Speak your thoughts naturally');
    expect(container.textContent).toContain('AI will automatically organize');
  });

  it('renders stat card icons', () => {
    const { container } = render(<Dashboard />);
    // Check for emoji icons in container
    expect(container.textContent).toContain('📝');
    expect(container.textContent).toContain('📅');
    expect(container.textContent).toContain('✅');
    expect(container.textContent).toContain('💡');
  });

  it('handles partial stats gracefully', () => {
    const partialStats = {
      totalLogs: 10,
      todayLogs: 1,
    };

    render(<Dashboard stats={partialStats as any} />);

    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    // Should show 0 for missing stats
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThan(0);
  });
});
