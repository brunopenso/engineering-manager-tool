import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App.js';
import { renderWithProviders, testAdminUser } from '../../src/test/renderWithProviders.js';

describe('US3 tag updates', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('saves updated tag data', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ tags: [{ id: 'tag-1', name: 'Platform', color: '#1976D2' }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ tag: { id: 'tag-1', name: 'Platform Team', color: '#1976D2' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ tags: [{ id: 'tag-1', name: 'Platform Team', color: '#1976D2' }] }),
      });
    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(<App />, {
      initialPath: '/app/admin/tags',
      isAuthenticated: true,
      user: testAdminUser,
    });

    const nameInput = await screen.findByDisplayValue('Platform');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Platform Team');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(screen.getByDisplayValue('Platform Team')).toBeInTheDocument();
    });
  });
});
