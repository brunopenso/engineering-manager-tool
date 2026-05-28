import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import HierarchyTree from '../../src/components/hierarchy/HierarchyTree.js';
import { renderWithProviders } from '../../src/test/renderWithProviders.js';

describe('US2 hierarchy tree interaction', () => {
  it('highlights current position and toggles node expansion state', () => {
    renderWithProviders(
      <HierarchyTree
        self={{
          id: 'leader-1',
          displayName: 'Team Leader',
          email: 'leader@example.com',
          isCurrentPosition: true,
        }}
        reports={[
          {
            id: 'report-1',
            displayName: 'Direct Report',
            email: 'direct@example.com',
            children: [
              {
                id: 'report-2',
                displayName: 'Nested Report',
                email: 'nested@example.com',
              },
            ],
          },
        ]}
      />,
      { isAuthenticated: true },
    );

    expect(screen.getByTestId('current-position-marker')).toBeInTheDocument();

    const directReportButton = screen.getByRole('button', { name: /direct report/i });
    expect(directReportButton).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(directReportButton);
    expect(directReportButton).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(directReportButton);
    expect(directReportButton).toHaveAttribute('aria-expanded', 'false');
  });
});
