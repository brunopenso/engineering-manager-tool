import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App.js';
import { renderWithProviders, testAdminUser } from '../src/test/renderWithProviders.js';

describe('US4 delete errors', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows API error when delete fails', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ tags: [{ id: 'tag-1', name: 'Platform', color: '#1976D2' }] }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ code: 'NOT_FOUND', message: 'Tag not found.' }),
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
      expect(screen.getByText('Tag not found.')).toBeInTheDocument();
    });
  });
});
