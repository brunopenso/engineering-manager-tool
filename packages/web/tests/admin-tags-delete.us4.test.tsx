import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App.js';
import { renderWithProviders, testAdminUser } from '../src/test/renderWithProviders.js';

describe('US4 delete tag flow', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('opens confirmation and deletes tag', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ tags: [{ id: 'tag-1', name: 'Platform', color: '#1976D2' }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 204,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ tags: [] }),
      });
    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(<App />, {
      initialPath: '/app/admin/tags',
      isAuthenticated: true,
      user: testAdminUser,
    });

    await userEvent.click(await screen.findByRole('button', { name: 'Delete' }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete', hidden: false }));

    await waitFor(() => {
      expect(screen.getByText('No tags yet. Create your first tag to start the catalog.')).toBeInTheDocument();
    });
  });
});
