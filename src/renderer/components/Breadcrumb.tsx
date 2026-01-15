/**
 * Breadcrumb Component
 * AI-32: Add item-to-log traceability links
 *
 * Provides breadcrumb navigation for the application.
 * Shows the current location and allows navigation back through the hierarchy.
 */

import React from 'react';

export interface BreadcrumbItem {
  /** Label to display for this breadcrumb */
  label: string;
  /** Optional callback when this breadcrumb is clicked */
  onClick?: () => void;
  /** Whether this is the current/active breadcrumb (last in chain) */
  isActive?: boolean;
}

export interface BreadcrumbProps {
  /** Array of breadcrumb items to display */
  items: BreadcrumbItem[];
  /** Optional separator between breadcrumbs */
  separator?: string;
  /** Optional CSS class for styling */
  className?: string;
}

/**
 * Breadcrumb navigation component.
 *
 * Features:
 * - Shows hierarchical navigation path
 * - Clickable breadcrumbs for navigation
 * - Active breadcrumb styling
 * - Customizable separator
 *
 * Usage:
 * ```tsx
 * <Breadcrumb
 *   items={[
 *     { label: 'Home', onClick: () => navigate('/') },
 *     { label: 'Todos', onClick: () => navigate('/todos') },
 *     { label: 'Todo #123', isActive: true }
 *   ]}
 * />
 * ```
 */
export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  separator = '/',
  className = '',
}) => {
  return (
    <nav
      className={`breadcrumb ${className}`}
      aria-label="Breadcrumb"
      data-testid="breadcrumb"
    >
      <ol className="breadcrumb-list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isActive = item.isActive ?? isLast;

          return (
            <li
              key={`${item.label}-${index}`}
              className={`breadcrumb-item ${isActive ? 'active' : ''}`}
              data-testid={`breadcrumb-item-${index}`}
            >
              {item.onClick && !isActive ? (
                <button
                  className="breadcrumb-link"
                  onClick={item.onClick}
                  data-testid={`breadcrumb-link-${index}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.label}
                </button>
              ) : (
                <span
                  className="breadcrumb-text"
                  data-testid={`breadcrumb-text-${index}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
              {!isLast && (
                <span
                  className="breadcrumb-separator"
                  data-testid={`breadcrumb-separator-${index}`}
                  aria-hidden="true"
                >
                  {' '}
                  {separator}{' '}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
