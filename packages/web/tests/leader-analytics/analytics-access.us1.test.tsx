import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App.js';
import { defaultLast60DayRange } from '../../src/services/leaderAnalyticsApi.js';
import { LEADER_TEAM_ANALYTICS_ROUTE } from '../../src/routes/shellOptions.js';
import { renderWithProviders, testLeaderUser, testUser } from '../../src/test/renderWithProviders.js';
import { getVisibleShellMenuOptions } from '../../src/routes/shellOptions.js';

describe('US1 leader team analytics access', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows Team Analytics menu entry for leaders', () => {
    const options = getVisibleShellMenuOptions(testLeaderUser);
    expect(options.some((option) => option.route === LEADER_TEAM_ANALYTICS_ROUTE)).toBe(true);
    expect(options.some((option) => option.label === 'Team Analytics')).toBe(true);
  });

  it('hides Team Analytics menu entry for non-leaders', () => {
    const options = getVisibleShellMenuOptions(testUser);
    expect(options.some((option) => option.route === LEADER_TEAM_ANALYTICS_ROUTE)).toBe(false);
  });

  it('redirects non-leader users away from team analytics', async () => {
    renderWithProviders(<App />, {
      initialPath: LEADER_TEAM_ANALYTICS_ROUTE,
      isAuthenticated: true,
      user: testUser,
    });

    expect(await screen.findByRole('heading', { name: 'Welcome' })).toBeInTheDocument();
  });

  it('loads team analytics with default 60-day range', async () => {
    const defaultRange = defaultLast60DayRange();
    const analyticsUrl = '/users/leader/team-analytics';

    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('/users/leader/hierarchy-view')) {
        return {
          ok: true,
          json: async () => ({
            manager: null,
            self: {
              id: 'leader-1',
              displayName: 'Team Leader',
              email: 'leader@example.com',
              isLeader: true,
            },
            reports: [
              {
                id: 'report-1',
                displayName: 'Alice Report',
                email: 'alice@example.com',
                isLeader: false,
              },
            ],
          }),
        };
      }

      if (url.includes(analyticsUrl)) {
        return {
          ok: true,
          json: async () => ({
            startDate: defaultRange.startDate,
            endDate: defaultRange.endDate,
            weekStarts: ['2026-04-07'],
            deliverablesByWeekAndImpact: [],
            engagementByWeek: [],
            pendingReviewCount: 3,
            pendingReviewByImpact: [
              { impact: 'LOW', count: 1 },
              { impact: 'MEDIUM', count: 1 },
              { impact: 'HIGH', count: 1 },
              { impact: 'TRANSFORMATIONAL', count: 0 },
            ],
          }),
        };
      }

      return { ok: false, json: async () => ({ code: 'FORBIDDEN', message: 'Unexpected URL' }) };
    });

    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(<App />, {
      initialPath: LEADER_TEAM_ANALYTICS_ROUTE,
      isAuthenticated: true,
      user: testLeaderUser,
    });

    await waitFor(() => {
      expect(screen.getByText('Team Analytics')).toBeInTheDocument();
    });

    expect(screen.getByTestId('analytics-start-date-input')).toHaveValue(defaultRange.startDate);
    expect(screen.getByTestId('analytics-end-date-input')).toHaveValue(defaultRange.endDate);

    await waitFor(() => {
      expect(screen.getByTestId('pending-review-widget')).toHaveTextContent('3');
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(analyticsUrl),
      expect.any(Object),
    );
  });
});
