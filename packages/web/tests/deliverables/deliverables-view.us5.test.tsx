import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App.js';
import { renderWithProviders } from '../../src/test/renderWithProviders.js';

describe('US5 superior read-only view', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders read-only portfolio for another user', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ownerUserId: 'user-report',
          readOnly: true,
          deliverables: [
            {
              id: 'del-1',
              ownerUserId: 'user-report',
              title: 'Report deliverable',
              businessImpact: 'MEDIUM',
              systemTags: [{ id: 'tag-1', name: 'Platform', color: '#1976D2' }],
              updatedAt: '2026-05-26T00:00:00.000Z',
            },
          ],
        }),
      }),
    );

    renderWithProviders(<App />, {
      isAuthenticated: true,
      initialPath: '/app/deliverables/view/user-report',
    });

    await waitFor(() => {
      expect(screen.getByText('Team member deliverables')).toBeInTheDocument();
      expect(screen.getByText('Report deliverable')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Add deliverable' })).not.toBeInTheDocument();
    });
  });
});
