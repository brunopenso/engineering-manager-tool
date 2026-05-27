import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '../App.js';
import { renderWithProviders, testUser } from '../test/renderWithProviders.js';

describe('leader hierarchy management guards', () => {
  it('redirects non-leader users to welcome route', async () => {
    renderWithProviders(<App />, {
      initialPath: '/app/leader/hierarchy',
      isAuthenticated: true,
      user: testUser,
    });

    expect(await screen.findByRole('heading', { name: 'Welcome' })).toBeInTheDocument();
  });
});
