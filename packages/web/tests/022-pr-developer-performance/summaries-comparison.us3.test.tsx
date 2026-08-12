import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App.js';
import { LEADER_TEAM_PR_PERFORMANCE_ROUTE } from '../../src/routes/shellOptions.js';
import { defaultLast60DayRange } from '../../src/services/leaderPrPerformanceApi.js';
import { renderWithProviders, testLeaderUser } from '../../src/test/renderWithProviders.js';

describe('US3 summaries and comparison', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders summary cards and comparison chart from aggregate payload', async () => {
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
            totals: { authoredPullRequestCount: 2, commentCount: 3, reviewCount: 1 },
            developers: [
              {
                userId: 'report-1',
                displayName: 'Alice Report',
                email: 'alice@example.com',
                githubLogin: 'alice',
                authoredPullRequestCount: 2,
                commentCount: 3,
                reviewCount: 1,
              },
            ],
            weekStarts: [defaultRange.startDate],
            authoredByWeekAndClassification: [],
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
      expect(screen.getByTestId('pr-performance-authored-count')).toHaveTextContent('2');
    });
    expect(screen.getByTestId('pr-performance-comment-count')).toHaveTextContent('3');
    expect(screen.getByTestId('pr-performance-review-count')).toHaveTextContent('1');
    expect(screen.getByTestId('pr-performance-comparison-chart')).toBeInTheDocument();
  });
});
