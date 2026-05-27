import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App.js';
import { renderWithProviders, testAdminUser } from '../src/test/renderWithProviders.js';

describe('US3 update error handling', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows API error messages when update fails', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ tags: [{ id: 'tag-1', name: 'Platform', color: '#1976D2' }] }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          code: 'DUPLICATE_TAG_NAME',
          message: 'A tag with this name already exists.',
        }),
      });
    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(<App />, {
      initialPath: '/app/admin/tags',
      isAuthenticated: true,
      user: testAdminUser,
    });

    await userEvent.click(await screen.findByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(screen.getByText('A tag with this name already exists.')).toBeInTheDocument();
    });
  });
});
