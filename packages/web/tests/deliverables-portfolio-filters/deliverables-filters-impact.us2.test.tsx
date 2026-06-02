import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App.js';
import { renderWithProviders } from '../../src/test/renderWithProviders.js';

describe('US2 deliverables portfolio impact filter', { timeout: 15000 }, () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('refetches with businessImpact query when impact selected', async () => {
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
      expect(screen.getByTestId('impact-filter-select')).toBeInTheDocument();
    });

    const select = screen.getByTestId('impact-filter-select');
    fireEvent.mouseDown(select.querySelector('[role="combobox"]')!);
    await userEvent.click(await screen.findByRole('option', { name: 'High' }));

    await waitFor(() => {
      expect(fetchCalls.some((url) => url.includes('businessImpact=HIGH'))).toBe(true);
    });
  });
});
