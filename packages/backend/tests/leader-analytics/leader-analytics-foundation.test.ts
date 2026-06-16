import { beforeEach, describe, expect, it, vi } from 'vitest';
import { USER_ROLE_TYPES } from '../../src/auth/types.js';
import * as leaderAnalyticsService from '../../src/services/leaderAnalyticsService.js';
import { TeamDeliverablesDateError, validateDateRange } from '../../src/services/teamDeliverablesDate.js';
import * as userService from '../../src/services/userService.js';
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

vi.mock('../../src/services/userService.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/userService.js')>();
  return {
    ...actual,
    assertUserInLeaderSubtree: vi.fn(),
  };
});

describe('leader analytics foundation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    const app = buildLeaderAnalyticsTestApp({
      userId: 'leader-1',
      includeAuth: false,
    });
    await registerLeaderAnalyticsTestRoutes(app);

    const response = await app.inject({
      method: 'GET',
      url: '/users/leader/team-analytics?startDate=2026-04-01&endDate=2026-06-04',
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().code).toBe('MISSING_APP_TOKEN');

    await app.close();
  });

  it('returns 403 for non-leader', async () => {
    const app = buildLeaderAnalyticsTestApp({
      userId: 'user-1',
      roles: [USER_ROLE_TYPES.COLLABORATOR],
    });
    await registerLeaderAnalyticsTestRoutes(app);

    const response = await app.inject({
      method: 'GET',
      url: '/users/leader/team-analytics?startDate=2026-04-01&endDate=2026-06-04',
    });

    expect(response.statusCode).toBe(403);

    await app.close();
  });

  it('returns 400 for invalid date range', async () => {
    const app = buildLeaderAnalyticsTestApp({
      userId: 'leader-1',
      roles: [USER_ROLE_TYPES.COLLABORATOR, USER_ROLE_TYPES.LEADER],
    });
    await registerLeaderAnalyticsTestRoutes(app);

    vi.mocked(leaderAnalyticsService.getLeaderTeamAnalytics).mockImplementation(
      async (_actorUserId, filters) => {
        validateDateRange(filters.startDate, filters.endDate);
        return {
          startDate: filters.startDate,
          endDate: filters.endDate,
          weekStarts: [],
          deliverablesByWeekAndImpact: [],
          engagementByWeek: [],
          pendingReviewCount: 0,
        };
      },
    );

    const response = await app.inject({
      method: 'GET',
      url: '/users/leader/team-analytics?startDate=2026-06-04&endDate=2026-04-01',
    });

    expect(response.statusCode).toBe(400);

    await app.close();
  });

  it('returns 403 when userId is outside subtree', async () => {
    const app = buildLeaderAnalyticsTestApp({
      userId: 'leader-1',
      roles: [USER_ROLE_TYPES.COLLABORATOR, USER_ROLE_TYPES.LEADER],
    });
    await registerLeaderAnalyticsTestRoutes(app);

    vi.mocked(userService.assertUserInLeaderSubtree).mockRejectedValue(
      Object.assign(new Error('forbidden'), { name: 'FORBIDDEN' }),
    );

    const response = await app.inject({
      method: 'GET',
      url: '/users/leader/team-analytics?startDate=2026-04-01&endDate=2026-06-04&userId=outsider-1',
    });

    expect(response.statusCode).toBe(403);
    expect(userService.assertUserInLeaderSubtree).toHaveBeenCalledWith('leader-1', 'outsider-1');

    await app.close();
  });

  it('returns analytics payload for leader', async () => {
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
      pendingReviewCount: 2,
    });

    const response = await app.inject({
      method: 'GET',
      url: '/users/leader/team-analytics?startDate=2026-04-01&endDate=2026-06-04',
    });

    expect(response.statusCode).toBe(200);
    expect(leaderAnalyticsService.getLeaderTeamAnalytics).toHaveBeenCalledWith('leader-1', {
      startDate: '2026-04-01',
      endDate: '2026-06-04',
    });
    expect(response.json().pendingReviewCount).toBe(2);

    await app.close();
  });
});
