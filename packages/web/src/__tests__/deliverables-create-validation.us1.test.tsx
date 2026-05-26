import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DeliverablesPage from '../pages/DeliverablesPage.js';
import { renderWithProviders } from '../test/renderWithProviders.js';

describe('US1 deliverable create validation', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('disables save when required fields are missing', async () => {
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

    await userEvent.click(screen.getByRole('button', { name: 'Add deliverable' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    });
  });
});
