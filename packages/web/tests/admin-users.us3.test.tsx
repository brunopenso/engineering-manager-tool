import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App.js';
import { renderWithProviders, testAdminUser } from '../src/test/renderWithProviders.js';

describe('US3 admin users page', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders user role management for administrators', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          users: [testAdminUser],
        }),
      }),
    );

    renderWithProviders(<App />, {
      initialPath: '/app/admin/users',
      isAuthenticated: true,
      user: testAdminUser,
    });

    await waitFor(() => {
      expect(screen.getByText('User role management')).toBeInTheDocument();
    });
  });
});
