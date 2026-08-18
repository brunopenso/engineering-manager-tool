import { beforeEach, describe, expect, it, vi } from 'vitest';
import { USER_ROLE_TYPES } from '../../src/auth/types.js';
import * as leaderPrPerformanceService from '../../src/services/leaderPrPerformanceService.js';
import * as userService from '../../src/services/userService.js';
import {
  buildTeamPrPerformanceTestApp,
  registerTeamPrPerformanceTestRoutes,
} from './team-pr-performance-test-app.js';

vi.mock('../../src/services/leaderPrPerformanceService.js', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../src/services/leaderPrPerformanceService.js')>();
  return {
    ...actual,
    getLeaderTeamPrPerformance: vi.fn(),
  };
});

vi.mock('../../src/services/userService.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/userService.js')>();
  return {
    ...actual,
    assertUserInLeaderSubtree: vi.fn(),
  };
});

describe('US2 team PR performance filters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes optional userId to performance service', async () => {
    const app = buildTeamPrPerformanceTestApp({
      userId: 'leader-1',
      roles: [USER_ROLE_TYPES.COLLABORATOR, USER_ROLE_TYPES.LEADER],
    });
    await registerTeamPrPerformanceTestRoutes(app);

    vi.mocked(userService.assertUserInLeaderSubtree).mockResolvedValue(undefined);
    vi.mocked(leaderPrPerformanceService.getLeaderTeamPrPerformance).mockResolvedValue({
      startDate: '2026-06-14',
      endDate: '2026-08-12',
      userId: 'report-1',
      totals: { authoredPullRequestCount: 1, commentCount: 0, reviewCount: 0 },
      developers: [
        {
          userId: 'report-1',
          displayName: 'Alice',
          email: 'alice@example.com',
          githubLogin: 'alice',
          authoredPullRequestCount: 1,
          commentCount: 0,
          reviewCount: 0,
        },
      ],
      weekStarts: [],
      authoredByWeekAndClassification: [],
    });

    const response = await app.inject({
      method: 'GET',
      url: '/users/leader/team-pr-performance?startDate=2026-06-14&endDate=2026-08-12&userId=report-1',
    });

    expect(response.statusCode).toBe(200);
    expect(leaderPrPerformanceService.getLeaderTeamPrPerformance).toHaveBeenCalledWith('leader-1', {
      startDate: '2026-06-14',
      endDate: '2026-08-12',
      userId: 'report-1',
      scope: 'subtree',
    });

    await app.close();
  });

  it('omits userId when clearing member filter (subtree-wide)', async () => {
    const app = buildTeamPrPerformanceTestApp({
      userId: 'leader-1',
      roles: [USER_ROLE_TYPES.COLLABORATOR, USER_ROLE_TYPES.LEADER],
    });
    await registerTeamPrPerformanceTestRoutes(app);

    vi.mocked(leaderPrPerformanceService.getLeaderTeamPrPerformance).mockResolvedValue({
      startDate: '2026-06-14',
      endDate: '2026-08-12',
      totals: { authoredPullRequestCount: 0, commentCount: 0, reviewCount: 0 },
      developers: [],
      weekStarts: [],
      authoredByWeekAndClassification: [],
    });

    const response = await app.inject({
      method: 'GET',
      url: '/users/leader/team-pr-performance?startDate=2026-06-14&endDate=2026-08-12',
    });

    expect(response.statusCode).toBe(200);
    expect(leaderPrPerformanceService.getLeaderTeamPrPerformance).toHaveBeenCalledWith('leader-1', {
      startDate: '2026-06-14',
      endDate: '2026-08-12',
    });
    expect(userService.assertUserInLeaderSubtree).not.toHaveBeenCalled();

    await app.close();
  });
});
