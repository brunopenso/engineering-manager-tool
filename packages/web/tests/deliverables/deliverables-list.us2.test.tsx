import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DeliverablesPage from '../../src/pages/DeliverablesPage.js';
import { renderWithProviders } from '../../src/test/renderWithProviders.js';
import { stubDeliverablesPageFetch } from './deliverables-page-fetch-mock.js';

describe('US2 deliverables list', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders portfolio rows with impact and tags', async () => {
    stubDeliverablesPageFetch({
      list: {
        deliverables: [
          {
            id: 'del-1',
            ownerUserId: 'user-1',
            title: 'API redesign',
            businessImpact: 'HIGH',
            systemTags: [{ id: 'tag-1', name: 'Platform', color: '#1976D2' }],
            createdAt: '2026-05-26T00:00:00.000Z',
            updatedAt: '2026-05-26T00:00:00.000Z',
          },
        ],
      },
      tags: [{ id: 'tag-1', name: 'Platform', color: '#1976D2' }],
    });

    renderWithProviders(<DeliverablesPage />, { isAuthenticated: true });

    await waitFor(() => {
      expect(screen.getByText('API redesign')).toBeInTheDocument();
      expect(screen.getByText('HIGH')).toBeInTheDocument();
      expect(screen.getByText('Platform')).toBeInTheDocument();
    });
  });
});
