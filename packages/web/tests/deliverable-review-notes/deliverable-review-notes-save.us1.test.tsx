import { fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithI18n } from '../../src/test/renderWithProviders.js';
import DeliverableReviewNotesPanel from '../../src/components/team-deliverables/DeliverableReviewNotesPanel.js';

describe('US1 deliverable review notes save', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('saves notes, shows success feedback, and notifies reviewed change', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          deliverableId: 'del-1',
          notes: null,
          reviewed: false,
          updatedAt: null,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          deliverableId: 'del-1',
          notes: 'Strong delivery',
          reviewed: true,
          updatedAt: '2026-05-30T12:00:00.000Z',
        }),
      });

    vi.stubGlobal('fetch', fetchMock);

    const onReviewedChange = vi.fn();

    renderWithI18n(
      <DeliverableReviewNotesPanel
        deliverableId="del-1"
        accessToken="token-1"
        active
        onReviewedChange={onReviewedChange}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('review-notes-input')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('review-notes-input'), {
      target: { value: 'Strong delivery' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save notes' }));

    await waitFor(() => {
      expect(screen.getByText('Review notes saved.')).toBeInTheDocument();
    });

    expect(onReviewedChange).toHaveBeenCalledWith('del-1', true);
  });
});
