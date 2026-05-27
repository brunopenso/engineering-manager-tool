import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DeliverablesPage from '../../src/pages/DeliverablesPage.js';
import { renderWithProviders } from '../../src/test/renderWithProviders.js';

describe('US4 deliverable delete', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('confirms delete and removes item from list', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            deliverables: [
              {
                id: 'del-1',
                ownerUserId: 'user-1',
                title: 'API redesign',
                businessImpact: 'HIGH',
                systemTags: [],
                updatedAt: '2026-05-26T00:00:00.000Z',
              },
            ],
          }),
        })
        .mockResolvedValueOnce({ ok: true, status: 204 })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ deliverables: [] }),
        }),
    );

    renderWithProviders(<DeliverablesPage />, { isAuthenticated: true });

    await waitFor(() => {
      expect(screen.getByText('API redesign')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(screen.getByText('No deliverables yet')).toBeInTheDocument();
    });
  });
});
