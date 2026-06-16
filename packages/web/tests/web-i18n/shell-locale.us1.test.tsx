import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import AppShellLayout from '../../src/components/shell/AppShellLayout.js';
import { renderWithProviders, testLeaderUser } from '../../src/test/renderWithProviders.js';

describe('US1 shell locale English', () => {
  it('shows English navigation labels for a leader', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <AppShellLayout />,
      { isAuthenticated: true, user: testLeaderUser, initialPath: '/app' },
    );

    await user.click(screen.getByRole('button', { name: 'open drawer' }));

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Team Deliverables')).toBeInTheDocument();
    expect(screen.getByText('Leader')).toBeInTheDocument();
  });
});
