import { fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App.js';
import { renderWithProviders, testLeaderUser } from '../../src/test/renderWithProviders.js';

describe('US1 leader hierarchy management page', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('searches orphan users and allows assignment', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          users: [
            {
              id: 'user-1',
              fullName: 'Alice Example',
              email: 'alice@example.com',
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          userId: 'user-1',
          leaderId: testLeaderUser.id,
          updatedAt: '2026-05-27T00:00:00.000Z',
        }),
      });
    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(<App />, {
      initialPath: '/app/leader/hierarchy',
      isAuthenticated: true,
      user: testLeaderUser,
    });

    expect(screen.getByRole('tab', { name: 'Assign users' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Create User' })).toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox', { name: /search by name or email/i }), {
      target: { value: 'ali' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));

    await waitFor(() => {
      expect(screen.getByText('Alice Example')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Assign to me' }));

    await waitFor(() => {
      expect(screen.getByText(/assigned successfully/i)).toBeInTheDocument();
    });
  });
});
