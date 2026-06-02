import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DeliverablesPage from '../../src/pages/DeliverablesPage.js';
import { renderWithProviders } from '../../src/test/renderWithProviders.js';
import { stubDeliverablesPageFetch } from './deliverables-page-fetch-mock.js';

describe('US2 deliverables empty state', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows empty state when no deliverables exist', async () => {
    stubDeliverablesPageFetch({
      list: { deliverables: [], hasAnyDeliverables: false },
    });

    renderWithProviders(<DeliverablesPage />, { isAuthenticated: true });

    await waitFor(() => {
      expect(screen.getByText('No deliverables yet')).toBeInTheDocument();
    });
  });
});
