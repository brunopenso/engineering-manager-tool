import { fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App.js';
import { renderWithProviders, testLeaderUser } from '../test/renderWithProviders.js';

describe('leader hierarchy management page', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads and assigns an orphan user', async () => {
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
