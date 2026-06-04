import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App.js';
import { renderWithProviders, testAdminUser } from '../../src/test/renderWithProviders.js';

describe('US1 empty GitHub integrations state', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows empty state when no integrations exist', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ integrations: [] }),
      }),
    );

    renderWithProviders(<App />, {
      initialPath: '/app/admin/github',
      isAuthenticated: true,
      user: testAdminUser,
    });

    await waitFor(() => {
      expect(
        screen.getByText(
          'No GitHub organizations enabled yet. Add the first organization login above to enable integration scope.',
        ),
      ).toBeInTheDocument();
    });
  });
});
