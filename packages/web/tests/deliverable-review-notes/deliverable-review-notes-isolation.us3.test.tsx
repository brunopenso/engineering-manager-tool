import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import DeliverableReviewNotesPanel from '../../src/components/team-deliverables/DeliverableReviewNotesPanel.js';

describe('US3 deliverable review notes isolation', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads only the current leader notes returned by the API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          deliverableId: 'del-1',
          notes: 'Leader-specific note',
          reviewed: true,
          updatedAt: '2026-05-30T12:00:00.000Z',
        }),
      }),
    );

    render(
      <DeliverableReviewNotesPanel deliverableId="del-1" accessToken="leader-a-token" active />,
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Leader-specific note')).toBeInTheDocument();
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/deliverables/del-1/review-notes'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer leader-a-token' }),
      }),
    );
  });
});
