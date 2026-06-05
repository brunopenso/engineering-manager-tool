import { describe, expect, it, vi } from 'vitest';
import { USER_ROLE_TYPES } from '../../src/auth/types.js';
import * as leaderAnalyticsService from '../../src/services/leaderAnalyticsService.js';
import {
  buildLeaderAnalyticsTestApp,
  registerLeaderAnalyticsTestRoutes,
} from './leader-analytics-test-app.js';

vi.mock('../../src/services/leaderAnalyticsService.js', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../src/services/leaderAnalyticsService.js')>();
  return {
    ...actual,
    getLeaderTeamAnalytics: vi.fn(),
  };
});

describe('leader analytics DAC', () => {
  it('scopes analytics through service for leader actor', async () => {
    const app = buildLeaderAnalyticsTestApp({
      userId: 'leader-1',
      roles: [USER_ROLE_TYPES.COLLABORATOR, USER_ROLE_TYPES.LEADER],
    });
    await registerLeaderAnalyticsTestRoutes(app);

    vi.mocked(leaderAnalyticsService.getLeaderTeamAnalytics).mockResolvedValue({
      startDate: '2026-04-01',
      endDate: '2026-06-04',
      weekStarts: [],
      deliverablesByWeekAndImpact: [],
      engagementByWeek: [],
      pendingReviewCount: 0,
    });

    await app.inject({
      method: 'GET',
      url: '/users/leader/team-analytics?startDate=2026-04-01&endDate=2026-06-04',
    });

    expect(leaderAnalyticsService.getLeaderTeamAnalytics).toHaveBeenCalledWith(
      'leader-1',
      expect.objectContaining({ startDate: '2026-04-01', endDate: '2026-06-04' }),
    );

    await app.close();
  });
});
