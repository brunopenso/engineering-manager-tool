import { fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App.js';
import { renderWithProviders } from '../../src/test/renderWithProviders.js';

describe('US1 deliverables portfolio date filters', { timeout: 15000 }, () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads with default date query params on initial fetch', async () => {
    const fetchCalls: string[] = [];

    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        fetchCalls.push(url);

        if (url.includes('/tags/catalog')) {
          return {
            ok: true,
            json: async () => ({ tags: [{ id: 'tag-1', name: 'Platform', color: '#336699' }] }),
          };
        }

        if (url.includes('/deliverables?')) {
          return {
            ok: true,
            json: async () => ({
              deliverables: [
                {
                  id: 'del-1',
                  ownerUserId: 'user-1',
                  title: 'Recent work',
                  businessImpact: 'HIGH',
                  systemTags: [],
                  createdAt: '2026-05-20T00:00:00.000Z',
                  updatedAt: '2026-05-21T00:00:00.000Z',
                },
              ],
              hasAnyDeliverables: true,
            }),
          };
        }

        return { ok: false, json: async () => ({ code: 'FORBIDDEN', message: 'Unexpected URL' }) };
      }),
    );

    renderWithProviders(<App />, {
      initialPath: '/app/deliverables',
      isAuthenticated: true,
    });

    await waitFor(() => {
      expect(screen.getByText('Recent work')).toBeInTheDocument();
    });

    const listCall = fetchCalls.find((url) => url.includes('/deliverables?'));
    expect(listCall).toBeDefined();
    expect(listCall).toContain('startDate=');
    expect(listCall).toContain('endDate=');
  });

  it('shows date validation error when end date is before start date', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('/tags/catalog')) {
          return { ok: true, json: async () => ({ tags: [] }) };
        }

        return {
          ok: true,
          json: async () => ({ deliverables: [], hasAnyDeliverables: false }),
        };
      }),
    );

    renderWithProviders(<App />, {
      initialPath: '/app/deliverables',
      isAuthenticated: true,
    });

    await waitFor(() => {
      expect(screen.getByTestId('start-date-input')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('start-date-input'), {
      target: { value: '2026-06-10' },
    });
    fireEvent.change(screen.getByTestId('end-date-input'), {
      target: { value: '2026-06-01' },
    });

    await waitFor(() => {
      expect(screen.getByText(/End date must be on or after start date/i)).toBeInTheDocument();
    });
  });
});
