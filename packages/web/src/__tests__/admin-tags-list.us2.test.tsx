import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App.js';
import { renderWithProviders, testAdminUser } from '../test/renderWithProviders.js';

describe('US2 tags catalog list', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders existing tags for administrators', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          tags: [{ id: 'tag-1', name: 'Platform', color: '#1976D2' }],
        }),
      }),
    );

    renderWithProviders(<App />, {
      initialPath: '/app/admin/tags',
      isAuthenticated: true,
      user: testAdminUser,
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Platform')).toBeInTheDocument();
    });
  });
});
