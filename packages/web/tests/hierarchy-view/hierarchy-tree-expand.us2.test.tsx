import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import HierarchyTree from '../../src/components/hierarchy/HierarchyTree.js';
import { renderWithProviders } from '../../src/test/renderWithProviders.js';

describe('US2 hierarchy tree initial expansion', () => {
  it('starts with only the self node expanded', () => {
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
            displayName: 'Nested Report',
            email: 'nested@example.com',
            children: [
              {
                id: 'report-2',
                displayName: 'Deep Report',
                email: 'deep@example.com',
              },
            ],
          },
        ]}
      />,
      { isAuthenticated: true },
    );

    expect(screen.getByText('Nested Report')).toBeVisible();
    expect(screen.queryByText('Deep Report')).not.toBeInTheDocument();

    const nestedButton = screen.getByRole('button', { name: /nested report/i });
    fireEvent.click(nestedButton);

    expect(screen.getByText('Deep Report')).toBeVisible();
  });
});
