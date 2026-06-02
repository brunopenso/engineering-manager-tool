import { fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App.js';
import { renderWithProviders, testLeaderUser } from '../test/renderWithProviders.js';

describe('leader hierarchy management page', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads and assigns an orphan user', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo) => {
        const url = String(input);

        if (url.includes('/users/leader/hierarchy-view')) {
          return {
            ok: true,
            json: async () => ({
              manager: null,
              self: {
                id: testLeaderUser.id,
                displayName: testLeaderUser.fullName,
                email: testLeaderUser.email,
                isCurrentPosition: true,
                isLeader: true,
              },
              reports: [],
            }),
          };
        }

        if (url.includes('/users/orphans')) {
          return {
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
          };
        }

        if (url.includes('/assign-leader')) {
          return {
            ok: true,
            json: async () => ({
              userId: 'user-1',
              leaderId: testLeaderUser.id,
              updatedAt: '2026-05-27T00:00:00.000Z',
            }),
          };
        }

        throw new Error(`Unexpected fetch: ${url}`);
      }),
    );

    renderWithProviders(<App />, {
      initialPath: '/app/leader/hierarchy',
      isAuthenticated: true,
      user: testLeaderUser,
    });

    expect(screen.getByRole('tab', { name: 'View' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Assign users' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Create User' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Assign users' }));
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
