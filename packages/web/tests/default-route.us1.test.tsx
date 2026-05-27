import App from '../src/App.js';
import { renderWithProviders } from '../src/test/renderWithProviders.js';
import { LOGIN_HEADING } from '../src/test/testHelpers.js';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('US1 default and alias routes', () => {
  it('renders login entry for /', () => {
    renderWithProviders(<App />, { initialPath: '/' });

    expect(screen.getByRole('heading', { name: LOGIN_HEADING })).toBeInTheDocument();
  });

  it('renders login entry for /login', () => {
    renderWithProviders(<App />, { initialPath: '/login' });

    expect(screen.getByRole('heading', { name: LOGIN_HEADING })).toBeInTheDocument();
  });

  it('redirects authenticated unknown routes to /app default content', () => {
    renderWithProviders(<App />, {
      initialPath: '/somewhere-else',
      isAuthenticated: true,
    });

    expect(screen.getByRole('heading', { name: 'Welcome' })).toBeInTheDocument();
  });
});
