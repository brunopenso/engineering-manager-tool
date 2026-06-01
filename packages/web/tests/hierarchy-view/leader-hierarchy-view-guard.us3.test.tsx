import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '../../src/App.js';
import { renderWithProviders, testUser } from '../../src/test/renderWithProviders.js';

describe('US3 hierarchy view route guards', () => {
  it('redirects non-leader users away from hierarchy view', async () => {
    renderWithProviders(<App />, {
      initialPath: '/app/leader/hierarchy',
      isAuthenticated: true,
      user: testUser,
    });

    expect(await screen.findByRole('heading', { name: 'Welcome' })).toBeInTheDocument();
  });

  it('redirects unauthenticated users to login', async () => {
    renderWithProviders(<App />, {
      initialPath: '/app/leader/hierarchy',
      isAuthenticated: false,
    });

    expect(
      await screen.findByText(/sign in with google to access/i),
    ).toBeInTheDocument();
  });
});
