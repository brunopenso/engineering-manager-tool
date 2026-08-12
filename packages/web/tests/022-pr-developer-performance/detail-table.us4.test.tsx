import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App.js';
import { LEADER_TEAM_PR_PERFORMANCE_ROUTE } from '../../src/routes/shellOptions.js';
import { defaultLast60DayRange } from '../../src/services/leaderPrPerformanceApi.js';
import { renderWithProviders, testLeaderUser } from '../../src/test/renderWithProviders.js';

describe('US4 detail table and drill-down', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('opens drill-down modal from table row and closes without losing filters', async () => {
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

      if (url.includes('/pull-requests')) {
        return {
          ok: true,
          json: async () => ({
            userId: 'report-1',
            startDate: defaultRange.startDate,
            endDate: defaultRange.endDate,
            pullRequests: [
              {
                id: 'pr-1',
                title: 'Ship feature',
                repository: 'org/repo',
                mergedAt: '2026-07-15T00:00:00.000Z',
                involvementRole: 'owner',
                effectiveClassification: 'feature',
                url: null,
                actorCommentCount: 0,
                actorReviewCount: 0,
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
            weekStarts: [],
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
      expect(screen.getByTestId('pr-performance-developers-table')).toBeInTheDocument();
    });

    expect(screen.getByTestId('pr-performance-start-date-input')).toHaveValue(
      defaultRange.startDate,
    );

    await userEvent.click(screen.getByTestId('pr-performance-developer-row-report-1'));

    expect(await screen.findByTestId('pr-performance-drilldown-modal')).toBeInTheDocument();
    expect(await screen.findByText('Ship feature')).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('pr-performance-drilldown-close'));

    await waitFor(() => {
      expect(screen.queryByTestId('pr-performance-drilldown-modal')).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('pr-performance-start-date-input')).toHaveValue(
      defaultRange.startDate,
    );
  });
});
