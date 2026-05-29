import { fireEvent, screen, within } from '@testing-library/react';
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
          isLeader: true,
        }}
        reports={[
          {
            id: 'report-1',
            displayName: 'Direct Report',
            email: 'direct@example.com',
            isLeader: false,
            children: [
              {
                id: 'report-2',
                displayName: 'Nested Report',
                email: 'nested@example.com',
                isLeader: true,
              },
            ],
          },
        ]}
      />,
      { isAuthenticated: true },
    );

    expect(screen.getByTestId('current-position-marker')).toBeInTheDocument();
    expect(screen.queryByTestId('role-collaborador')).not.toBeInTheDocument();
    expect(screen.getAllByTestId('role-leader')).toHaveLength(1);

    const directReportButton = screen.getByRole('button', { name: /direct report/i });
    expect(within(directReportButton).queryByTestId('role-leader')).not.toBeInTheDocument();

    expect(directReportButton).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(directReportButton);
    expect(directReportButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByTestId('role-leader')).toHaveLength(2);

    fireEvent.click(directReportButton);
    expect(directReportButton).toHaveAttribute('aria-expanded', 'false');
  });
});
