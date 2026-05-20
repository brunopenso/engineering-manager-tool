import App from '../App.js';
import { renderWithProviders, testUser } from '../test/renderWithProviders.js';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('US1 auth guard', () => {
  it('redirects unauthenticated users to login', () => {
    renderWithProviders(<App />, { initialPath: '/app' });

    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
  });

  it('redirects users with missing email to login', () => {
    renderWithProviders(<App />, {
      initialPath: '/app',
      isAuthenticated: true,
      user: { ...testUser, email: '' },
    });

    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
  });
});
