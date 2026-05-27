import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App.js';
import { renderWithProviders, testAdminUser } from '../src/test/renderWithProviders.js';

describe('US2 empty tags state', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows empty state when no tags exist', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ tags: [] }),
      }),
    );

    renderWithProviders(<App />, {
      initialPath: '/app/admin/tags',
      isAuthenticated: true,
      user: testAdminUser,
    });

    await waitFor(() => {
      expect(screen.getByText('No tags yet. Create your first tag to start the catalog.')).toBeInTheDocument();
    });
  });
});
