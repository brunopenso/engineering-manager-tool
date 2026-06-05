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

describe('leader analytics empty team', () => {
  it('returns zero counts for empty analytics', async () => {
    const app = buildLeaderAnalyticsTestApp({
      userId: 'leader-1',
      roles: [USER_ROLE_TYPES.COLLABORATOR, USER_ROLE_TYPES.LEADER],
    });
    await registerLeaderAnalyticsTestRoutes(app);

    vi.mocked(leaderAnalyticsService.getLeaderTeamAnalytics).mockResolvedValue({
      startDate: '2026-04-01',
      endDate: '2026-06-04',
      weekStarts: ['2026-03-31'],
      deliverablesByWeekAndImpact: [],
      engagementByWeek: [],
      pendingReviewCount: 0,
    });

    const response = await app.inject({
      method: 'GET',
      url: '/users/leader/team-analytics?startDate=2026-04-01&endDate=2026-06-04',
    });

    expect(response.json().pendingReviewCount).toBe(0);
    expect(response.json().engagementByWeek).toEqual([]);

    await app.close();
  });
});
