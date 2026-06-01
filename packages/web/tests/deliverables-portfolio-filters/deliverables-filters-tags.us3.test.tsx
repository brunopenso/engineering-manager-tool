import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App.js';
import { renderWithProviders } from '../../src/test/renderWithProviders.js';

describe('US3 deliverables portfolio tag filter', { timeout: 15000 }, () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads tag catalog for filter options', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('/tags/catalog')) {
          return {
            ok: true,
            json: async () => ({
              tags: [{ id: 'tag-1', name: 'Platform', color: '#336699' }],
            }),
          };
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
      expect(screen.getByTestId('tag-filter-select')).toBeInTheDocument();
    });
  });
});
