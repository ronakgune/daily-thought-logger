/**
 * Sidebar Component Tests
 * AI-25: Sidebar navigation and log history tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Sidebar, LogGroup } from '../../../src/renderer/components/Sidebar';

describe('Sidebar', () => {
  const mockLogs: LogGroup[] = [
    {
      date: 'Today',
      logs: [
        { id: 1, time: '2:30 PM', preview: 'First log preview' },
        { id: 2, time: '10:15 AM', preview: 'Second log preview' },
      ],
    },
    {
      date: 'Yesterday',
      logs: [
        { id: 3, time: '4:45 PM', preview: 'Yesterday log preview' },
      ],
    },
  ];

  it('renders header with title', () => {
    render(<Sidebar />);
    expect(screen.getByText('Daily Thought Logger')).toBeInTheDocument();
    expect(screen.getByText('Capture your thoughts')).toBeInTheDocument();
  });

  it('renders all navigation items', () => {
    render(<Sidebar />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Log History')).toBeInTheDocument();
    expect(screen.getByText('Todos')).toBeInTheDocument();
    expect(screen.getByText('Ideas')).toBeInTheDocument();
    expect(screen.getByText('Learnings')).toBeInTheDocument();
    expect(screen.getByText('Accomplishments')).toBeInTheDocument();
  });

  it('highlights current view', () => {
    render(<Sidebar currentView="todos" />);

    const todosButton = screen.getByText('Todos').closest('button');
    expect(todosButton).toHaveClass('bg-primary-100', 'text-primary-700');
  });

  it('calls onNavigate when navigation item is clicked', () => {
    const handleNavigate = vi.fn();
    render(<Sidebar onNavigate={handleNavigate} />);

    const ideasButton = screen.getByText('Ideas');
    fireEvent.click(ideasButton);

    expect(handleNavigate).toHaveBeenCalledWith('ideas');
  });

  it('displays log groups with date headers', () => {
    render(<Sidebar logs={mockLogs} />);

    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Yesterday')).toBeInTheDocument();
  });

  it('displays all logs with time and preview', () => {
    render(<Sidebar logs={mockLogs} />);

    expect(screen.getByText('2:30 PM')).toBeInTheDocument();
    expect(screen.getByText('First log preview')).toBeInTheDocument();

    expect(screen.getByText('10:15 AM')).toBeInTheDocument();
    expect(screen.getByText('Second log preview')).toBeInTheDocument();

    expect(screen.getByText('4:45 PM')).toBeInTheDocument();
    expect(screen.getByText('Yesterday log preview')).toBeInTheDocument();
  });

  it('calls onLogSelect when log is clicked', () => {
    const handleLogSelect = vi.fn();
    render(<Sidebar logs={mockLogs} onLogSelect={handleLogSelect} />);

    const firstLog = screen.getByText('First log preview').closest('button');
    fireEvent.click(firstLog!);

    expect(handleLogSelect).toHaveBeenCalledWith(1);
  });

  it('highlights selected log', () => {
    render(<Sidebar logs={mockLogs} selectedLogId={2} />);

    const secondLog = screen.getByText('Second log preview').closest('button');
    expect(secondLog).toHaveClass('bg-primary-50');
  });

  it('shows empty state when no logs', () => {
    render(<Sidebar logs={[]} />);
    expect(screen.getByText('No logs yet. Start recording!')).toBeInTheDocument();
  });

  it('renders new recording button', () => {
    render(<Sidebar />);
    expect(screen.getByText('+ New Recording')).toBeInTheDocument();
  });

  it('logs to console when new recording button is clicked', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    render(<Sidebar />);

    const newRecordingButton = screen.getByText('+ New Recording');
    fireEvent.click(newRecordingButton);

    expect(consoleSpy).toHaveBeenCalledWith('Open recorder');
    consoleSpy.mockRestore();
  });
});
