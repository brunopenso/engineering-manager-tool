import { fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App.js';
import { renderWithProviders } from '../../src/test/renderWithProviders.js';

describe('US1 deliverable create validation', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('disables save when required fields are missing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
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

  it('enables save when required fields are filled and system tags are empty', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ tags: [{ id: 'tag-1', name: 'Platform', color: '#1976D2' }] }),
      }),
    );

    renderWithProviders(<App />, {
      initialPath: '/app/deliverables/new',
      isAuthenticated: true,
    });

    await waitFor(() => {
      expect(screen.queryByText('Loading deliverable form...')).not.toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole('textbox', { name: 'Title' }), {
      target: { value: 'API redesign' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Description' }), {
      target: { value: 'Shipped new API' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Your role in this deliverable' }), {
      target: { value: 'Tech lead' },
    });
    fireEvent.change(
      screen.getByRole('textbox', { name: 'Personal performance improvement points' }),
      { target: { value: 'Write more docs' } },
    );

    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  });
});
