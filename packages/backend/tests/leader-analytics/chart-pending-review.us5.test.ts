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

describe('US5 pending review count', () => {
  it('returns pendingReviewCount from service', async () => {
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
      pendingReviewCount: 5,
      pendingReviewByImpact: [
        { impact: 'LOW', count: 1 },
        { impact: 'MEDIUM', count: 1 },
        { impact: 'HIGH', count: 2 },
        { impact: 'TRANSFORMATIONAL', count: 1 },
      ],
    });

    const response = await app.inject({
      method: 'GET',
      url: '/users/leader/team-analytics?startDate=2026-04-01&endDate=2026-06-04',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().pendingReviewCount).toBe(5);
    expect(response.json().pendingReviewByImpact).toHaveLength(4);

    await app.close();
  });
});
