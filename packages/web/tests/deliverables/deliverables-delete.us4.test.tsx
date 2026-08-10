import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DeliverablesPage from '../../src/pages/DeliverablesPage.js';
import { renderWithProviders } from '../../src/test/renderWithProviders.js';
import { stubDeliverablesPageFetch } from './deliverables-page-fetch-mock.js';

describe('US4 deliverable delete', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('confirms delete and removes item from list', async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.includes('/tags/catalog')) {
        return { ok: true, json: async () => ({ tags: [] }) };
      }

      if (url.includes('/deliverables?')) {
        const isAfterDelete =
          fetchMock.mock.calls.filter((call) => String(call[0]).includes('/deliverables?')).length >
          1;

        return {
          ok: true,
          json: async () =>
            isAfterDelete
              ? { deliverables: [], hasAnyDeliverables: false }
              : {
                  deliverables: [
                    {
                      id: 'del-1',
                      ownerUserId: 'user-1',
                      title: 'API redesign',
                      businessImpact: 'HIGH',
                      systemTags: [],
                      createdAt: '2026-05-26T00:00:00.000Z',
                      updatedAt: '2026-05-26T00:00:00.000Z',
                    },
                  ],
                  hasAnyDeliverables: true,
                },
        };
      }

      if (url.includes('/deliverables/del-1') && init?.method === 'DELETE') {
        return { ok: true, status: 204 };
      }

      return { ok: false, json: async () => ({ code: 'FORBIDDEN', message: 'Unexpected URL' }) };
    });

    vi.stubGlobal('fetch', fetchMock);

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
