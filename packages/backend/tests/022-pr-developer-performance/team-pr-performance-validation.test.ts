import { beforeEach, describe, expect, it, vi } from 'vitest';
import { USER_ROLE_TYPES } from '../../src/auth/types.js';
import * as leaderPrPerformanceService from '../../src/services/leaderPrPerformanceService.js';
import { TeamDeliverablesDateError } from '../../src/services/teamDeliverablesDate.js';
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

const emptyPerformance = {
  startDate: '2026-06-14',
  endDate: '2026-08-12',
  totals: { authoredPullRequestCount: 0, commentCount: 0, reviewCount: 0 },
  developers: [],
  weekStarts: [],
  authoredByWeekAndClassification: [],
};

describe('team PR performance validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when startDate/endDate are missing', async () => {
    const app = buildTeamPrPerformanceTestApp({
      userId: 'leader-1',
      roles: [USER_ROLE_TYPES.COLLABORATOR, USER_ROLE_TYPES.LEADER],
    });
    await registerTeamPrPerformanceTestRoutes(app);

    const response = await app.inject({
      method: 'GET',
      url: '/users/leader/team-pr-performance',
    });

    expect(response.statusCode).toBe(400);
    await app.close();
  });

  it('returns 400 when date range is invalid', async () => {
    const app = buildTeamPrPerformanceTestApp({
      userId: 'leader-1',
      roles: [USER_ROLE_TYPES.COLLABORATOR, USER_ROLE_TYPES.LEADER],
    });
    await registerTeamPrPerformanceTestRoutes(app);

    vi.mocked(leaderPrPerformanceService.getLeaderTeamPrPerformance).mockRejectedValue(
      new TeamDeliverablesDateError('End date must be on or after start date.'),
    );

    const response = await app.inject({
      method: 'GET',
      url: '/users/leader/team-pr-performance?startDate=2026-08-12&endDate=2026-06-14',
    });

    expect(response.statusCode).toBe(400);
    await app.close();
  });

  it('returns 401 when unauthenticated', async () => {
    const app = buildTeamPrPerformanceTestApp({
      userId: 'leader-1',
      roles: [USER_ROLE_TYPES.COLLABORATOR, USER_ROLE_TYPES.LEADER],
      includeAuth: false,
    });
    await registerTeamPrPerformanceTestRoutes(app);

    const response = await app.inject({
      method: 'GET',
      url: '/users/leader/team-pr-performance?startDate=2026-06-14&endDate=2026-08-12',
    });

    expect(response.statusCode).toBe(401);
    await app.close();
  });

  it('returns 403 for non-leader', async () => {
    const app = buildTeamPrPerformanceTestApp({
      userId: 'collab-1',
      roles: [USER_ROLE_TYPES.COLLABORATOR],
    });
    await registerTeamPrPerformanceTestRoutes(app);

    const response = await app.inject({
      method: 'GET',
      url: '/users/leader/team-pr-performance?startDate=2026-06-14&endDate=2026-08-12',
    });

    expect(response.statusCode).toBe(403);
    expect(leaderPrPerformanceService.getLeaderTeamPrPerformance).not.toHaveBeenCalled();
    await app.close();
  });

  it('returns 403 when userId is outside subtree', async () => {
    const app = buildTeamPrPerformanceTestApp({
      userId: 'leader-1',
      roles: [USER_ROLE_TYPES.COLLABORATOR, USER_ROLE_TYPES.LEADER],
    });
    await registerTeamPrPerformanceTestRoutes(app);

    vi.mocked(userService.assertUserInLeaderSubtree).mockRejectedValue(
      Object.assign(new Error('forbidden'), { name: 'FORBIDDEN' }),
    );

    const response = await app.inject({
      method: 'GET',
      url: '/users/leader/team-pr-performance?startDate=2026-06-14&endDate=2026-08-12&userId=peer-9',
    });

    expect(response.statusCode).toBe(403);
    expect(leaderPrPerformanceService.getLeaderTeamPrPerformance).not.toHaveBeenCalled();
    await app.close();
  });

  it('returns empty aggregates for leader with valid dates', async () => {
    const app = buildTeamPrPerformanceTestApp({
      userId: 'leader-1',
      roles: [USER_ROLE_TYPES.COLLABORATOR, USER_ROLE_TYPES.LEADER],
    });
    await registerTeamPrPerformanceTestRoutes(app);

    vi.mocked(leaderPrPerformanceService.getLeaderTeamPrPerformance).mockResolvedValue(
      emptyPerformance,
    );

    const response = await app.inject({
      method: 'GET',
      url: '/users/leader/team-pr-performance?startDate=2026-06-14&endDate=2026-08-12',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      totals: { authoredPullRequestCount: 0, commentCount: 0, reviewCount: 0 },
      developers: [],
    });
    await app.close();
  });
});
