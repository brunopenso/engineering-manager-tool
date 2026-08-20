import { beforeEach, describe, expect, it, vi } from 'vitest';
import { USER_ROLE_TYPES } from '../../src/auth/types.js';
import * as leaderAnalyticsService from '../../src/services/leaderAnalyticsService.js';
import * as userService from '../../src/services/userService.js';
import {
  buildLeaderAnalyticsTestApp,
  registerLeaderAnalyticsTestRoutes,
} from '../leader-analytics/leader-analytics-test-app.js';

vi.mock('../../src/services/leaderAnalyticsService.js', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../src/services/leaderAnalyticsService.js')>();
  return { ...actual, getLeaderTeamAnalytics: vi.fn() };
});

vi.mock('../../src/services/userService.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/userService.js')>();
  return {
    ...actual,
    assertUserInLeaderSubtree: vi.fn(),
  };
});

describe('US2 itself option API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes scope=itself to analytics service', async () => {
    const app = buildLeaderAnalyticsTestApp({
      userId: 'leader-1',
      roles: [USER_ROLE_TYPES.COLLABORATOR, USER_ROLE_TYPES.LEADER],
    });
    await registerLeaderAnalyticsTestRoutes(app);

    vi.mocked(userService.assertUserInLeaderSubtree).mockResolvedValue(undefined);
    vi.mocked(leaderAnalyticsService.getLeaderTeamAnalytics).mockResolvedValue({
      startDate: '2026-07-01',
      endDate: '2026-08-12',
      userId: 'alice',
      scope: 'itself',
      weekStarts: [],
      deliverablesByWeekAndImpact: [],
      engagementByWeek: [],
      pendingReviewCount: 0,
      pendingReviewByImpact: [],
    });

    await app.inject({
      method: 'GET',
      url: '/users/leader/team-analytics?startDate=2026-07-01&endDate=2026-08-12&userId=alice&scope=itself',
    });

    expect(leaderAnalyticsService.getLeaderTeamAnalytics).toHaveBeenCalledWith(
      'leader-1',
      expect.objectContaining({ userId: 'alice', scope: 'itself' }),
    );

    await app.close();
  });
});
