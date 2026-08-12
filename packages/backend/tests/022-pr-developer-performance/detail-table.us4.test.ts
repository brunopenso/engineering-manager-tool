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
    getLeaderDeveloperPrDrilldown: vi.fn(),
  };
});

vi.mock('../../src/services/userService.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/userService.js')>();
  return {
    ...actual,
    assertUserInLeaderSubtree: vi.fn(),
  };
});

describe('US4 developer PR drill-down', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns contributing PRs newest-first for subtree member', async () => {
    const app = buildTeamPrPerformanceTestApp({
      userId: 'leader-1',
      roles: [USER_ROLE_TYPES.COLLABORATOR, USER_ROLE_TYPES.LEADER],
    });
    await registerTeamPrPerformanceTestRoutes(app);

    vi.mocked(userService.assertUserInLeaderSubtree).mockResolvedValue(undefined);
    vi.mocked(leaderPrPerformanceService.getLeaderDeveloperPrDrilldown).mockResolvedValue({
      userId: 'report-1',
      startDate: '2026-06-14',
      endDate: '2026-08-12',
      pullRequests: [
        {
          id: 'pr-2',
          title: 'Newer',
          repository: 'org/repo',
          mergedAt: '2026-08-01T00:00:00.000Z',
          involvementRole: 'owner',
          effectiveClassification: 'feature',
          url: null,
          actorCommentCount: 0,
          actorReviewCount: 0,
        },
        {
          id: 'pr-1',
          title: 'Older involved',
          repository: 'org/repo',
          mergedAt: '2026-07-01T00:00:00.000Z',
          involvementRole: 'involved',
          effectiveClassification: 'unclassified',
          url: null,
          actorCommentCount: 2,
          actorReviewCount: 1,
        },
      ],
    });

    const response = await app.inject({
      method: 'GET',
      url: '/users/leader/team-pr-performance/developers/report-1/pull-requests?startDate=2026-06-14&endDate=2026-08-12',
    });

    expect(response.statusCode).toBe(200);
    expect(userService.assertUserInLeaderSubtree).toHaveBeenCalledWith('leader-1', 'report-1');
    expect(leaderPrPerformanceService.getLeaderDeveloperPrDrilldown).toHaveBeenCalledWith(
      'leader-1',
      'report-1',
      { startDate: '2026-06-14', endDate: '2026-08-12' },
    );
    expect(response.json().pullRequests[0].involvementRole).toBe('owner');
    expect(response.json().pullRequests[1].involvementRole).toBe('involved');

    await app.close();
  });

  it('denies drill-down for out-of-subtree userId', async () => {
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
      url: '/users/leader/team-pr-performance/developers/peer-9/pull-requests?startDate=2026-06-14&endDate=2026-08-12',
    });

    expect(response.statusCode).toBe(403);
    expect(leaderPrPerformanceService.getLeaderDeveloperPrDrilldown).not.toHaveBeenCalled();

    await app.close();
  });

  it('returns 400 for invalid date range on drill-down', async () => {
    const app = buildTeamPrPerformanceTestApp({
      userId: 'leader-1',
      roles: [USER_ROLE_TYPES.COLLABORATOR, USER_ROLE_TYPES.LEADER],
    });
    await registerTeamPrPerformanceTestRoutes(app);

    vi.mocked(userService.assertUserInLeaderSubtree).mockResolvedValue(undefined);
    const { TeamDeliverablesDateError } =
      await import('../../src/services/teamDeliverablesDate.js');
    vi.mocked(leaderPrPerformanceService.getLeaderDeveloperPrDrilldown).mockRejectedValue(
      new TeamDeliverablesDateError('End date must be on or after start date.'),
    );

    const response = await app.inject({
      method: 'GET',
      url: '/users/leader/team-pr-performance/developers/report-1/pull-requests?startDate=2026-08-12&endDate=2026-06-14',
    });

    expect(response.statusCode).toBe(400);
    await app.close();
  });
});
