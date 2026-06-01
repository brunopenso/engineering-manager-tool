import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import DeliverableReviewNotesPanel from '../../src/components/team-deliverables/DeliverableReviewNotesPanel.js';

describe('US4 deliverable review notes DAC UI', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows error when notes API returns 403', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          code: 'FORBIDDEN',
          message: 'You do not have permission to perform this action.',
        }),
      }),
    );

    render(
      <DeliverableReviewNotesPanel deliverableId="del-1" accessToken="token-1" active />,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/you do not have permission to perform this action/i),
      ).toBeInTheDocument();
    });
  });
});
