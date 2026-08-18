import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App.js';
import { LEADER_TEAM_PR_PERFORMANCE_ROUTE } from '../../src/routes/shellOptions.js';
import { defaultLast60DayRange } from '../../src/services/leaderPrPerformanceApi.js';
import { renderWithProviders, testLeaderUser } from '../../src/test/renderWithProviders.js';

function hierarchyWithAlice() {
  return {
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
  };
}

function emptyPerformance(startDate: string, endDate: string, userId?: string) {
  return {
    startDate,
    endDate,
    ...(userId ? { userId } : {}),
    totals: { authoredPullRequestCount: 0, commentCount: 0, reviewCount: 0 },
    developers: [],
    weekStarts: [],
    authoredByWeekAndClassification: [],
  };
}

function performanceWithAlice(startDate: string, endDate: string, userId?: string) {
  return {
    startDate,
    endDate,
    ...(userId ? { userId } : {}),
    totals: { authoredPullRequestCount: 2, commentCount: 1, reviewCount: 0 },
    developers: [
      {
        userId: 'report-1',
        displayName: 'Alice Report',
        email: 'alice@example.com',
        githubLogin: 'alice',
        authoredPullRequestCount: 2,
        commentCount: 1,
        reviewCount: 0,
      },
    ],
    weekStarts: [startDate],
    authoredByWeekAndClassification: [],
  };
}

describe('US2 team PR performance filters', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads with default 60-day range and refetches when member is selected then cleared', async () => {
    const defaultRange = defaultLast60DayRange();
    const performanceCalls: string[] = [];

    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('/users/leader/hierarchy-view')) {
        return { ok: true, json: async () => hierarchyWithAlice() };
      }

      if (url.includes('/users/leader/team-pr-performance')) {
        performanceCalls.push(url);
        const scoped = url.includes('userId=report-1');
        return {
          ok: true,
          json: async () =>
            performanceWithAlice(
              defaultRange.startDate,
              defaultRange.endDate,
              scoped ? 'report-1' : undefined,
            ),
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

    await screen.findByRole('heading', { name: 'Team PR Performance' });
    expect(screen.getByTestId('pr-performance-start-date-input')).toHaveValue(
      defaultRange.startDate,
    );
    expect(screen.getByTestId('pr-performance-end-date-input')).toHaveValue(defaultRange.endDate);

    await waitFor(() => expect(performanceCalls.length).toBeGreaterThanOrEqual(1));
    expect(performanceCalls[0]).toContain(`startDate=${defaultRange.startDate}`);
    expect(performanceCalls[0]).toContain(`endDate=${defaultRange.endDate}`);
    expect(performanceCalls[0]).not.toContain('userId=');

    await userEvent.click(screen.getByTestId('team-member-select'));
    await userEvent.click(await screen.findByRole('button', { name: 'Select Alice Report itself only' }));

    await waitFor(() => {
      expect(performanceCalls.some((call) => call.includes('userId=report-1'))).toBe(true);
    });

    await userEvent.click(screen.getByTestId('pr-performance-clear-member'));

    await waitFor(() => {
      const afterClear = performanceCalls.filter((call) => !call.includes('userId='));
      expect(afterClear.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('blocks fetch when end date is before start date and keeps prior valid results messaging', async () => {
    const defaultRange = defaultLast60DayRange();
    let performanceFetches = 0;

    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('/users/leader/hierarchy-view')) {
        return { ok: true, json: async () => hierarchyWithAlice() };
      }

      if (url.includes('/users/leader/team-pr-performance')) {
        performanceFetches += 1;
        return {
          ok: true,
          json: async () => performanceWithAlice(defaultRange.startDate, defaultRange.endDate),
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

    await screen.findByRole('heading', { name: 'Team PR Performance' });
    await waitFor(() => expect(performanceFetches).toBeGreaterThanOrEqual(1));
    const fetchesBeforeInvalid = performanceFetches;

    const endInput = screen.getByTestId('pr-performance-end-date-input');
    await userEvent.clear(endInput);
    await userEvent.type(endInput, '2020-01-01');

    expect(await screen.findByTestId('pr-performance-date-range-error')).toHaveTextContent(
      /end date must be on or after start date/i,
    );
    expect(performanceFetches).toBe(fetchesBeforeInvalid);
  });

  it('shows empty filtered state when API returns zero metrics', async () => {
    const defaultRange = defaultLast60DayRange();

    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('/users/leader/hierarchy-view')) {
        return { ok: true, json: async () => hierarchyWithAlice() };
      }

      if (url.includes('/users/leader/team-pr-performance')) {
        return {
          ok: true,
          json: async () => emptyPerformance(defaultRange.startDate, defaultRange.endDate),
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

    expect(await screen.findByTestId('pr-performance-empty-filtered')).toBeInTheDocument();
  });
});
