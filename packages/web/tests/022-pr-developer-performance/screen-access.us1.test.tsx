import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App.js';
import { defaultLast60DayRange } from '../../src/services/leaderPrPerformanceApi.js';
import {
  getVisibleShellMenuOptions,
  LEADER_TEAM_PR_PERFORMANCE_ROUTE,
} from '../../src/routes/shellOptions.js';
import {
  renderWithProviders,
  testLeaderUser,
  testUser,
} from '../../src/test/renderWithProviders.js';

describe('US1 leader team PR performance access', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows Team PR Performance menu entry for leaders', () => {
    const options = getVisibleShellMenuOptions(testLeaderUser);
    expect(options.some((option) => option.route === LEADER_TEAM_PR_PERFORMANCE_ROUTE)).toBe(true);
    expect(options.some((option) => option.label === 'Team PR Performance')).toBe(true);
  });

  it('hides Team PR Performance menu entry for non-leaders', () => {
    const options = getVisibleShellMenuOptions(testUser);
    expect(options.some((option) => option.route === LEADER_TEAM_PR_PERFORMANCE_ROUTE)).toBe(
      false,
    );
  });

  it('redirects non-leader users away from team PR performance', async () => {
    renderWithProviders(<App />, {
      initialPath: LEADER_TEAM_PR_PERFORMANCE_ROUTE,
      isAuthenticated: true,
      user: testUser,
    });

    expect(await screen.findByRole('heading', { name: 'Welcome' })).toBeInTheDocument();
  });

  it('loads team PR performance with default 60-day range', async () => {
    const defaultRange = defaultLast60DayRange();
    const performanceUrl = '/users/leader/team-pr-performance';

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

      if (url.includes(performanceUrl)) {
        return {
          ok: true,
          json: async () => ({
            startDate: defaultRange.startDate,
            endDate: defaultRange.endDate,
            totals: { authoredPullRequestCount: 2, commentCount: 1, reviewCount: 3 },
            developers: [
              {
                userId: 'report-1',
                displayName: 'Alice Report',
                email: 'alice@example.com',
                githubLogin: 'alice',
                authoredPullRequestCount: 2,
                commentCount: 1,
                reviewCount: 3,
              },
            ],
            weekStarts: [defaultRange.startDate],
            authoredByWeekAndClassification: [],
          }),
        };
      }

      return { ok: false, json: async () => ({ code: 'FORBIDDEN', message: 'Unexpected URL' }) };
    });

    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(<App />, {
      initialPath: LEADER_TEAM_PR_PERFORMANCE_ROUTE,
      isAuthenticated: true,
      user: testLeaderUser,
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Team PR Performance' })).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByTestId('team-pr-performance-loaded')).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(
        `${performanceUrl}?startDate=${defaultRange.startDate}&endDate=${defaultRange.endDate}`,
      ),
      expect.any(Object),
    );
  });

  it('shows empty guidance when leader has no team members', async () => {
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
            reports: [],
          }),
        };
      }

      if (url.includes('/users/leader/team-pr-performance')) {
        return {
          ok: true,
          json: async () => ({
            startDate: '2026-06-14',
            endDate: '2026-08-12',
            totals: { authoredPullRequestCount: 0, commentCount: 0, reviewCount: 0 },
            developers: [],
            weekStarts: [],
            authoredByWeekAndClassification: [],
          }),
        };
      }

      return { ok: false, json: async () => ({ code: 'FORBIDDEN', message: 'Unexpected URL' }) };
    });

    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(<App />, {
      initialPath: LEADER_TEAM_PR_PERFORMANCE_ROUTE,
      isAuthenticated: true,
      user: testLeaderUser,
    });

    expect(
      await screen.findByText(
        'No team members are available in your hierarchy. PR performance will appear when you have direct or indirect reports.',
      ),
    ).toBeInTheDocument();
  });
});
