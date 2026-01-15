/**
 * AppShell Component Tests
 * AI-25: Main window layout tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AppShell } from '../../../src/renderer/components/AppShell';

describe('AppShell', () => {
  it('renders sidebar and main content', () => {
    render(
      <AppShell
        sidebar={<div data-testid="sidebar">Sidebar Content</div>}
      >
        <div data-testid="main">Main Content</div>
      </AppShell>
    );

    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('main')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <AppShell
        sidebar={<div>Sidebar</div>}
        className="custom-class"
      >
        <div>Main</div>
      </AppShell>
    );

    const appShell = container.firstChild as HTMLElement;
    expect(appShell).toHaveClass('custom-class');
  });

  it('has correct layout structure', () => {
    const { container } = render(
      <AppShell sidebar={<div>Sidebar</div>}>
        <div>Main</div>
      </AppShell>
    );

    const appShell = container.firstChild as HTMLElement;
    expect(appShell).toHaveClass('flex', 'h-full', 'w-full');

    const sidebar = appShell.querySelector('aside');
    expect(sidebar).toBeInTheDocument();
    expect(sidebar).toHaveClass('w-sidebar');

    const main = appShell.querySelector('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveClass('flex-1');
  });

  it('makes sidebar scrollable', () => {
    const { container } = render(
      <AppShell sidebar={<div>Sidebar</div>}>
        <div>Main</div>
      </AppShell>
    );

    const sidebar = container.querySelector('aside');
    expect(sidebar).toHaveClass('overflow-y-auto');
  });

  it('makes main content scrollable', () => {
    const { container } = render(
      <AppShell sidebar={<div>Sidebar</div>}>
        <div>Main</div>
      </AppShell>
    );

    const main = container.querySelector('main');
    expect(main).toHaveClass('overflow-y-auto');
  });
});
