import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App.js';
import { renderWithProviders, testAdminUser } from '../../src/test/renderWithProviders.js';

describe('US1 admin tag creation', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('submits create form and renders new tag', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ tags: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ tag: { id: 'tag-1', name: 'Platform', color: '#1976D2' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ tags: [{ id: 'tag-1', name: 'Platform', color: '#1976D2' }] }),
      });
    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(<App />, {
      initialPath: '/app/admin/tags',
      isAuthenticated: true,
      user: testAdminUser,
    });

    await userEvent.type(screen.getByLabelText('Tag name'), 'Platform');
    await userEvent.click(screen.getByRole('button', { name: 'Create tag' }));

    await waitFor(() => {
      expect(screen.getByDisplayValue('Platform')).toBeInTheDocument();
    });
  });
});
