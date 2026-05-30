import { beforeEach, describe, expect, it, vi } from 'vitest';
import { USER_ROLE_TYPES } from '../../src/auth/types.js';
import * as deliverableService from '../../src/services/deliverableService.js';
import * as userService from '../../src/services/userService.js';
import { TeamDeliverablesDateError } from '../../src/services/teamDeliverablesDate.js';
import {
  buildTeamDeliverablesTestApp,
  registerTeamDeliverablesTestRoutes,
} from './team-deliverables-test-app.js';

vi.mock('../../src/services/userService.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/userService.js')>();
  return {
    ...actual,
    assertUserInLeaderSubtree: vi.fn(),
  };
});

vi.mock('../../src/services/deliverableService.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/deliverableService.js')>();
  return {
    ...actual,
    listTeamDeliverablesForReview: vi.fn(),
  };
});

describe('US2 team deliverables date filter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes date range to service for filtering', async () => {
    const app = buildTeamDeliverablesTestApp({
      userId: 'leader-1',
      roles: [USER_ROLE_TYPES.COLLABORATOR, USER_ROLE_TYPES.LEADER],
    });
    await registerTeamDeliverablesTestRoutes(app);

    vi.mocked(userService.assertUserInLeaderSubtree).mockResolvedValue(undefined);
    vi.mocked(deliverableService.listTeamDeliverablesForReview).mockResolvedValue([]);

    const response = await app.inject({
      method: 'GET',
      url: '/users/leader/team-deliverables?userId=report-1&startDate=2026-04-01&endDate=2026-05-29',
    });

    expect(response.statusCode).toBe(200);
    expect(deliverableService.listTeamDeliverablesForReview).toHaveBeenCalledWith(
      'report-1',
      'leader-1',
      '2026-04-01',
      '2026-05-29',
    );

    await app.close();
  });

  it('rejects invalid date range with 400', async () => {
    const app = buildTeamDeliverablesTestApp({
      userId: 'leader-1',
      roles: [USER_ROLE_TYPES.COLLABORATOR, USER_ROLE_TYPES.LEADER],
    });
    await registerTeamDeliverablesTestRoutes(app);

    vi.mocked(userService.assertUserInLeaderSubtree).mockResolvedValue(undefined);
    vi.mocked(deliverableService.listTeamDeliverablesForReview).mockRejectedValue(
      new TeamDeliverablesDateError('endDate must be on or after startDate.'),
    );

    const response = await app.inject({
      method: 'GET',
      url: '/users/leader/team-deliverables?userId=report-1&startDate=2026-05-29&endDate=2026-05-01',
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().message).toContain('endDate');

    await app.close();
  });
});
