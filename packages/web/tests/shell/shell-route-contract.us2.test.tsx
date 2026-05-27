import App from '../../src/App.js';
import { renderWithProviders } from '../../src/test/renderWithProviders.js';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { shellRouteContract } from '../../src/test/fixtures/shellRouteContract.js';

describe('US2 route contract', () => {
  it('keeps / and /login as public aliases', () => {
    expect(shellRouteContract.publicLoginRoutes).toEqual(['/', '/login']);
  });

  it('does not expose /app/welcome as a route', () => {
    renderWithProviders(<App />, { initialPath: '/app/welcome', isAuthenticated: true });

    expect(shellRouteContract.forbiddenRoutes).toContain('/app/welcome');
    expect(screen.getByRole('heading', { name: 'Welcome' })).toBeInTheDocument();
  });
});
