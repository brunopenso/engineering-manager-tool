import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import App from '../../src/App.js';
import { renderWithProviders, testLeaderUser } from '../../src/test/renderWithProviders.js';

describe('US3 assignment context in create form', () => {
  it('shows automatic assignment copy and no leader selector', () => {
    renderWithProviders(<App />, {
      initialPath: '/app/leader/users/new',
      isAuthenticated: true,
      user: testLeaderUser,
    });

    expect(screen.getByText(/Leader assigned automatically to you/i)).toBeInTheDocument();
    expect(screen.queryByLabelText('Leader')).not.toBeInTheDocument();
  });
});
