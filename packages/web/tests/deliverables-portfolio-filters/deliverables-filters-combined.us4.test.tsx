import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App.js';
import { renderWithProviders } from '../../src/test/renderWithProviders.js';

describe('US4 deliverables portfolio combined filters', { timeout: 15000 }, () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows filtered empty state when portfolio has items but filters match none', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('/tags/catalog')) {
          return { ok: true, json: async () => ({ tags: [] }) };
        }

        if (url.includes('/deliverables?')) {
          return {
            ok: true,
            json: async () => ({ deliverables: [], hasAnyDeliverables: true }),
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
      expect(screen.getByText(/No deliverables match your filters/i)).toBeInTheDocument();
    });
  });

  it('clears filters back to default date range', async () => {
    const fetchCalls: string[] = [];

    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        fetchCalls.push(url);

        if (url.includes('/tags/catalog')) {
          return { ok: true, json: async () => ({ tags: [] }) };
        }

        if (url.includes('/deliverables?')) {
          return {
            ok: true,
            json: async () => ({ deliverables: [], hasAnyDeliverables: false }),
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
      expect(screen.getByTestId('impact-filter-select')).toBeInTheDocument();
    });

    const impactSelect = screen.getByTestId('impact-filter-select');
    fireEvent.mouseDown(impactSelect.querySelector('[role="combobox"]')!);
    await userEvent.click(await screen.findByRole('option', { name: 'High' }));

    await waitFor(() => {
      expect(screen.getByTestId('clear-filters-button')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('clear-filters-button'));

    await waitFor(() => {
      const latestListCall = [...fetchCalls]
        .reverse()
        .find((url) => url.includes('/deliverables?'));
      expect(latestListCall).toBeDefined();
      expect(latestListCall).not.toContain('businessImpact=');
    });
  });
});
