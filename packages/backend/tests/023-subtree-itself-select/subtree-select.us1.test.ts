import { beforeEach, describe, expect, it, vi } from 'vitest';
import { USER_ROLE_TYPES } from '../../src/auth/types.js';
import * as leaderAnalyticsService from '../../src/services/leaderAnalyticsService.js';
import * as leaderPrPerformanceService from '../../src/services/leaderPrPerformanceService.js';
import * as userService from '../../src/services/userService.js';
import {
  buildTeamPrPerformanceTestApp,
  registerTeamPrPerformanceTestRoutes,
} from '../022-pr-developer-performance/team-pr-performance-test-app.js';
import {
  buildLeaderAnalyticsTestApp,
  registerLeaderAnalyticsTestRoutes,
} from '../leader-analytics/leader-analytics-test-app.js';

vi.mock('../../src/services/leaderAnalyticsService.js', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../src/services/leaderAnalyticsService.js')>();
  return { ...actual, getLeaderTeamAnalytics: vi.fn() };
});

vi.mock('../../src/services/leaderPrPerformanceService.js', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../src/services/leaderPrPerformanceService.js')>();
  return { ...actual, getLeaderTeamPrPerformance: vi.fn() };
});

vi.mock('../../src/services/userService.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/userService.js')>();
  return {
    ...actual,
    assertUserInLeaderSubtree: vi.fn(),
  };
});

describe('US1 subtree select on analytics and PR performance routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('defaults omitted scope to subtree for team-analytics', async () => {
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
      scope: 'subtree',
      weekStarts: [],
      deliverablesByWeekAndImpact: [],
      engagementByWeek: [],
      pendingReviewCount: 0,
      pendingReviewByImpact: [],
    });

    await app.inject({
      method: 'GET',
      url: '/users/leader/team-analytics?startDate=2026-07-01&endDate=2026-08-12&userId=alice',
    });

    expect(leaderAnalyticsService.getLeaderTeamAnalytics).toHaveBeenCalledWith(
      'leader-1',
      expect.objectContaining({ userId: 'alice', scope: 'subtree' }),
    );

    await app.close();
  });

  it('passes explicit subtree to team-pr-performance', async () => {
    const app = buildTeamPrPerformanceTestApp({
      userId: 'leader-1',
      roles: [USER_ROLE_TYPES.COLLABORATOR, USER_ROLE_TYPES.LEADER],
    });
    await registerTeamPrPerformanceTestRoutes(app);

    vi.mocked(userService.assertUserInLeaderSubtree).mockResolvedValue(undefined);
    vi.mocked(leaderPrPerformanceService.getLeaderTeamPrPerformance).mockResolvedValue({
      startDate: '2026-07-01',
      endDate: '2026-08-12',
      userId: 'alice',
      scope: 'subtree',
      totals: { authoredPullRequestCount: 0, commentCount: 0, reviewCount: 0 },
      developers: [],
      weekStarts: [],
      authoredByWeekAndClassification: [],
    });

    await app.inject({
      method: 'GET',
      url: '/users/leader/team-pr-performance?startDate=2026-07-01&endDate=2026-08-12&userId=alice&scope=subtree',
    });

    expect(leaderPrPerformanceService.getLeaderTeamPrPerformance).toHaveBeenCalledWith(
      'leader-1',
      expect.objectContaining({ userId: 'alice', scope: 'subtree' }),
    );

    await app.close();
  });
});
