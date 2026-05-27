import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App.js';
import { renderWithProviders } from '../src/test/renderWithProviders.js';

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
          json: async () => ({ tags: [] }),
        }),
    );

    renderWithProviders(<App />, {
      initialPath: '/app/deliverables/new',
      isAuthenticated: true,
    });

    await waitFor(() => {
      expect(screen.queryByText('Loading deliverable form...')).not.toBeInTheDocument();
    });

    expect(screen.getByRole('heading', { name: 'Add deliverable' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });
});
