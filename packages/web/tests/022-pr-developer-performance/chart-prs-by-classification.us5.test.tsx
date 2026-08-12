import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App.js';
import { LEADER_TEAM_PR_PERFORMANCE_ROUTE } from '../../src/routes/shellOptions.js';
import { defaultLast60DayRange } from '../../src/services/leaderPrPerformanceApi.js';
import { renderWithProviders, testLeaderUser } from '../../src/test/renderWithProviders.js';

describe('US5 weekly classification chart', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders classification chart including unclassified legend label', async () => {
    const defaultRange = defaultLast60DayRange();

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

      if (url.includes('/users/leader/team-pr-performance')) {
        return {
          ok: true,
          json: async () => ({
            startDate: defaultRange.startDate,
            endDate: defaultRange.endDate,
            totals: { authoredPullRequestCount: 2, commentCount: 0, reviewCount: 0 },
            developers: [
              {
                userId: 'report-1',
                displayName: 'Alice Report',
                email: 'alice@example.com',
                githubLogin: 'alice',
                authoredPullRequestCount: 2,
                commentCount: 0,
                reviewCount: 0,
              },
            ],
            weekStarts: ['2026-06-09'],
            authoredByWeekAndClassification: [
              { weekStart: '2026-06-09', classification: 'feature', count: 1 },
              { weekStart: '2026-06-09', classification: 'unclassified', count: 1 },
            ],
          }),
        };
      }

      return { ok: false, json: async () => ({}) };
    });

    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(<App />, {
      initialPath: LEADER_TEAM_PR_PERFORMANCE_ROUTE,
      isAuthenticated: true,
      user: testLeaderUser,
    });

    await waitFor(() => {
      expect(screen.getByTestId('pr-performance-classification-chart')).toBeInTheDocument();
    });
    expect(screen.getByText('Unclassified')).toBeInTheDocument();
  });
});
