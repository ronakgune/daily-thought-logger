/**
 * App Component Tests
 * AI-25: Main application component tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { App } from '../../../src/renderer/components/App';

describe('App', () => {
  it('renders with default dashboard view', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByText("Welcome back! Here's your overview.")).toBeInTheDocument();
  });

  it('renders with specified initial view', () => {
    render(<App initialView="todos" />);
    expect(screen.getByRole('heading', { name: 'Todos' })).toBeInTheDocument();
    expect(screen.getByText('Manage your action items and tasks.')).toBeInTheDocument();
  });

  it('renders sidebar with navigation', () => {
    render(<App />);
    expect(screen.getByText('Daily Thought Logger')).toBeInTheDocument();
    expect(screen.getByText('Log History')).toBeInTheDocument();
  });

  it('navigates to todos view when clicked', () => {
    render(<App />);

    const todosNav = screen.getAllByText('Todos')[0].closest('button');
    fireEvent.click(todosNav!);

    expect(screen.getByText('Manage your action items and tasks.')).toBeInTheDocument();
  });

  it('navigates to ideas view when clicked', () => {
    render(<App />);

    const ideasNav = screen.getAllByText('Ideas')[0].closest('button');
    fireEvent.click(ideasNav!);

    expect(screen.getByText('Browse and develop your ideas.')).toBeInTheDocument();
  });

  it('navigates to learnings view when clicked', () => {
    render(<App />);

    const learningsNav = screen.getAllByText('Learnings')[0].closest('button');
    fireEvent.click(learningsNav!);

    expect(screen.getByText('Review your insights and knowledge.')).toBeInTheDocument();
  });

  it('navigates to accomplishments view when clicked', () => {
    render(<App />);

    const accomplishmentsNav = screen.getAllByText('Accomplishments')[0].closest('button');
    fireEvent.click(accomplishmentsNav!);

    expect(screen.getByText('Celebrate your achievements.')).toBeInTheDocument();
  });

  it('navigates to log history view when clicked', () => {
    render(<App />);

    const logsNav = screen.getAllByText('Log History')[0].closest('button');
    fireEvent.click(logsNav!);

    expect(screen.getByText('View and search all your thought logs.')).toBeInTheDocument();
  });

  it('highlights current navigation item', () => {
    render(<App />);

    const dashboardNav = screen.getAllByText('Dashboard')[0].closest('button');
    expect(dashboardNav).toHaveClass('bg-primary-100');

    const todosNav = screen.getAllByText('Todos')[0].closest('button');
    fireEvent.click(todosNav!);

    expect(todosNav).toHaveClass('bg-primary-100');
    expect(dashboardNav).not.toHaveClass('bg-primary-100');
  });

  it('displays mock log data in sidebar', () => {
    const { container } = render(<App />);

    // Check date headers
    const todayHeaders = screen.getAllByText('Today');
    expect(todayHeaders.length).toBeGreaterThan(0);

    expect(screen.getByText('Yesterday')).toBeInTheDocument();
    expect(screen.getByText('2:30 PM')).toBeInTheDocument();
    expect(container.textContent).toContain('Had a great idea for improving');
  });

  it('selects log and navigates to logs view when log is clicked', () => {
    render(<App />);

    const logButtons = screen.getAllByText(/Had a great idea for improving/);
    const logButton = logButtons[0].closest('button');
    fireEvent.click(logButton!);

    expect(screen.getByText('View and search all your thought logs.')).toBeInTheDocument();
    expect(screen.getByText('Selected log: 1')).toBeInTheDocument();
  });

  it('displays mock stats in dashboard', () => {
    render(<App />);

    const statCards = screen.getAllByText(/^\d+$/);
    expect(statCards.length).toBeGreaterThan(0);
  });

  it('renders new recording button in sidebar', () => {
    render(<App />);
    expect(screen.getByText('+ New Recording')).toBeInTheDocument();
  });

  it('has AppShell layout structure', () => {
    const { container } = render(<App />);

    const aside = container.querySelector('aside');
    expect(aside).toBeInTheDocument();

    const main = container.querySelector('main');
    expect(main).toBeInTheDocument();
  });
});
