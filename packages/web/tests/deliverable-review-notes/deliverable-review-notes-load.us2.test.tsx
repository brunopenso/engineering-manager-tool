import { fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithI18n } from '../../src/test/renderWithProviders.js';
import DeliverableReviewNotesPanel from '../../src/components/team-deliverables/DeliverableReviewNotesPanel.js';

describe('US2 deliverable review notes load', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads saved notes when active', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          deliverableId: 'del-1',
          notes: 'Prior feedback',
          reviewed: true,
          updatedAt: '2026-05-29T10:00:00.000Z',
        }),
      }),
    );

    renderWithI18n(
      <DeliverableReviewNotesPanel deliverableId="del-1" accessToken="token-1" active />,
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Prior feedback')).toBeInTheDocument();
    });
  });

  it('shows empty guidance when no notes exist', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          deliverableId: 'del-1',
          notes: null,
          reviewed: false,
          updatedAt: null,
        }),
      }),
    );

    renderWithI18n(
      <DeliverableReviewNotesPanel deliverableId="del-1" accessToken="token-1" active />,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/add private coaching notes for this deliverable/i),
      ).toBeInTheDocument();
    });
  });

  it('shows retry on load failure and preserves draft text', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ code: 'FORBIDDEN', message: 'Unable to load notes.' }),
      }),
    );

    renderWithI18n(
      <DeliverableReviewNotesPanel deliverableId="del-1" accessToken="token-1" active />,
    );

    await waitFor(() => {
      expect(screen.getByText(/unable to load notes/i)).toBeInTheDocument();
    });

    const field = screen.getByTestId('review-notes-input');
    fireEvent.change(field, { target: { value: 'Draft while offline' } });
    expect(field).toHaveValue('Draft while offline');
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });
});
