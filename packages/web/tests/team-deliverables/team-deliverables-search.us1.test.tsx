import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App.js';
import { renderWithProviders, testLeaderUser } from '../../src/test/renderWithProviders.js';
import { defaultLast30DayRange } from '../../src/services/teamDeliverablesApi.js';

describe('US1 leader team deliverables page', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders team select, default dates, and empty state until selection', async () => {
    const defaultRange = defaultLast30DayRange();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        members: [{ id: 'report-1', displayName: 'Alice Report' }],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(<App />, {
      initialPath: '/app/leader/team-deliverables',
      isAuthenticated: true,
      user: testLeaderUser,
    });

    await waitFor(() => {
      expect(screen.getByText('Team Deliverables')).toBeInTheDocument();
    });

    expect(screen.getByTestId('team-member-select')).toBeInTheDocument();
    expect(screen.getByTestId('start-date-input')).toHaveValue(defaultRange.startDate);
    expect(screen.getByTestId('end-date-input')).toHaveValue(defaultRange.endDate);
    expect(screen.getByTestId('reviewed-filter')).toHaveTextContent('Not reviewed');
    expect(screen.getByText(/select a team member to search deliverables/i)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/users/leader/team-members'),
      expect.any(Object),
    );
  });
});
