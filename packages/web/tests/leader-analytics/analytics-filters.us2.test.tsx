import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App.js';
import { LEADER_TEAM_ANALYTICS_ROUTE } from '../../src/routes/shellOptions.js';
import { renderWithProviders, testLeaderUser } from '../../src/test/renderWithProviders.js';

describe('US2 leader analytics filters', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('refetches analytics when team member is selected', async () => {
    const analyticsCalls: string[] = [];

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

      if (url.includes('/users/leader/team-analytics')) {
        analyticsCalls.push(url);
        return {
          ok: true,
          json: async () => ({
            startDate: '2026-04-01',
            endDate: '2026-06-04',
            weekStarts: [],
            deliverablesByWeekAndImpact: [],
            engagementByWeek: [],
            pendingReviewCount: 0,
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

    await screen.findByText('Team Analytics');
    await waitFor(() => expect(analyticsCalls.length).toBeGreaterThanOrEqual(1));

    await userEvent.click(screen.getByTestId('team-member-select'));
    await userEvent.click(await screen.findByRole('button', { name: 'Select Alice Report itself only' }));

    await waitFor(() => {
      expect(analyticsCalls.some((call) => call.includes('userId=report-1'))).toBe(true);
    });
  });

  it('blocks fetch when end date is before start date', async () => {
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

      if (url.includes('/users/leader/team-analytics')) {
        return {
          ok: true,
          json: async () => ({
            startDate: '2026-06-04',
            endDate: '2026-04-01',
            weekStarts: [],
            deliverablesByWeekAndImpact: [],
            engagementByWeek: [],
            pendingReviewCount: 0,
          }),
        };
      }

      return { ok: false, json: async () => ({}) };
    });

    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(<App />, {
      initialPath: LEADER_TEAM_ANALYTICS_ROUTE,
      isAuthenticated: true,
      user: testLeaderUser,
    });

    await screen.findByText('Team Analytics');

    const endInput = screen.getByTestId('analytics-end-date-input');
    await userEvent.clear(endInput);
    await userEvent.type(endInput, '2020-01-01');

    expect(await screen.findByText(/end date must be on or after start date/i)).toBeInTheDocument();
  });
});
