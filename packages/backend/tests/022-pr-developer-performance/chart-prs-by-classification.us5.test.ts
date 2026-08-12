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

describe('US5 weekly classification chart payload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns authored-by-week classification including unclassified for leader scope', async () => {
    const app = buildTeamPrPerformanceTestApp({
      userId: 'leader-1',
      roles: [USER_ROLE_TYPES.COLLABORATOR, USER_ROLE_TYPES.LEADER],
    });
    await registerTeamPrPerformanceTestRoutes(app);

    vi.mocked(leaderPrPerformanceService.getLeaderTeamPrPerformance).mockResolvedValue({
      startDate: '2026-06-14',
      endDate: '2026-08-12',
      totals: { authoredPullRequestCount: 3, commentCount: 0, reviewCount: 0 },
      developers: [],
      weekStarts: ['2026-06-09', '2026-06-16'],
      authoredByWeekAndClassification: [
        { weekStart: '2026-06-09', classification: 'feature', count: 1 },
        { weekStart: '2026-06-09', classification: 'unclassified', count: 1 },
        { weekStart: '2026-06-16', classification: 'fix', count: 1 },
      ],
    });

    const response = await app.inject({
      method: 'GET',
      url: '/users/leader/team-pr-performance?startDate=2026-06-14&endDate=2026-08-12',
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.authoredByWeekAndClassification).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ classification: 'unclassified', count: 1 }),
        expect.objectContaining({ classification: 'feature', count: 1 }),
      ]),
    );
    const weekSum = body.authoredByWeekAndClassification
      .filter((row: { weekStart: string }) => row.weekStart === '2026-06-09')
      .reduce((sum: number, row: { count: number }) => sum + row.count, 0);
    expect(weekSum).toBe(2);

    await app.close();
  });

  it('scopes classification chart when userId is provided', async () => {
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
      developers: [],
      weekStarts: ['2026-06-09'],
      authoredByWeekAndClassification: [
        { weekStart: '2026-06-09', classification: 'maintenance', count: 1 },
      ],
    });

    const response = await app.inject({
      method: 'GET',
      url: '/users/leader/team-pr-performance?startDate=2026-06-14&endDate=2026-08-12&userId=report-1',
    });

    expect(response.statusCode).toBe(200);
    expect(leaderPrPerformanceService.getLeaderTeamPrPerformance).toHaveBeenCalledWith(
      'leader-1',
      expect.objectContaining({ userId: 'report-1' }),
    );
    expect(response.json().userId).toBe('report-1');

    await app.close();
  });
});
