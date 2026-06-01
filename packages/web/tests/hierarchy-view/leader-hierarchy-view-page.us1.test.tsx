import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App.js';
import { renderWithProviders, testLeaderUser } from '../../src/test/renderWithProviders.js';

describe('US1 leader hierarchy view page', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders manager section and report names', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          manager: {
            id: 'manager-1',
            displayName: 'Director Example',
            email: 'director@example.com',
            isLeader: true,
          },
          self: {
            id: testLeaderUser.id,
            displayName: testLeaderUser.fullName,
            email: testLeaderUser.email,
            isCurrentPosition: true,
            isLeader: true,
          },
          reports: [
            {
              id: 'report-1',
              displayName: 'Alice Report',
              email: 'alice@example.com',
              isLeader: false,
            },
          ],
        }),
      }),
    );

    renderWithProviders(<App />, {
      initialPath: '/app/leader/hierarchy',
      isAuthenticated: true,
      user: testLeaderUser,
    });

    await waitFor(() => {
      expect(screen.getByText('Your manager')).toBeInTheDocument();
    });

    expect(screen.getByText('Director Example')).toBeInTheDocument();
    expect(screen.getByText('Alice Report')).toBeInTheDocument();
    expect(screen.getByTestId('current-position-marker')).toBeInTheDocument();
  });
});
