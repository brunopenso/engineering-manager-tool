import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DeliverablesPage from '../pages/DeliverablesPage.js';
import { renderWithProviders } from '../test/renderWithProviders.js';

describe('US2 deliverables empty state', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows empty state when no deliverables exist', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ deliverables: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ tags: [] }),
        }),
    );

    renderWithProviders(<DeliverablesPage />, { isAuthenticated: true });

    await waitFor(() => {
      expect(screen.getByText('No deliverables yet')).toBeInTheDocument();
    });
  });
});
