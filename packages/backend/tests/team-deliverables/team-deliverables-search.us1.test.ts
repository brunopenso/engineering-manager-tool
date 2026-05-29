import { beforeEach, describe, expect, it, vi } from 'vitest';
import { USER_ROLE_TYPES } from '../../src/auth/types.js';
import * as deliverableService from '../../src/services/deliverableService.js';
import * as userService from '../../src/services/userService.js';
import {
  buildTeamDeliverablesTestApp,
  registerTeamDeliverablesTestRoutes,
} from './team-deliverables-test-app.js';

vi.mock('../../src/services/userService.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/userService.js')>();
  return {
    ...actual,
    getLeaderTeamMembers: vi.fn(),
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

describe('US1 team deliverables search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns team members for leader', async () => {
    const app = buildTeamDeliverablesTestApp({
      userId: 'leader-1',
      roles: [USER_ROLE_TYPES.COLLABORATOR, USER_ROLE_TYPES.LEADER],
    });
    await registerTeamDeliverablesTestRoutes(app);

    vi.mocked(userService.getLeaderTeamMembers).mockResolvedValue({
      members: [
        { id: 'report-1', displayName: 'Alice Report' },
        { id: 'report-2', displayName: 'bob@example.com' },
      ],
    });

    const response = await app.inject({
      method: 'GET',
      url: '/users/leader/team-members',
    });

    expect(response.statusCode).toBe(200);
    expect(userService.getLeaderTeamMembers).toHaveBeenCalledWith('leader-1');
    expect(response.json()).toEqual({
      members: [
        { id: 'report-1', displayName: 'Alice Report' },
        { id: 'report-2', displayName: 'bob@example.com' },
      ],
    });

    await app.close();
  });

  it('returns filtered deliverables for subtree member', async () => {
    const app = buildTeamDeliverablesTestApp({
      userId: 'leader-1',
      roles: [USER_ROLE_TYPES.COLLABORATOR, USER_ROLE_TYPES.LEADER],
    });
    await registerTeamDeliverablesTestRoutes(app);

    vi.mocked(userService.assertUserInLeaderSubtree).mockResolvedValue(undefined);
    vi.mocked(deliverableService.listTeamDeliverablesForReview).mockResolvedValue([
      {
        id: 'del-1',
        title: 'API redesign',
        description: 'Improved platform APIs',
        reviewed: false,
        systemTags: [],
      },
    ]);

    const response = await app.inject({
      method: 'GET',
      url: '/users/leader/team-deliverables?userId=report-1&startDate=2026-05-01&endDate=2026-05-29',
    });

    expect(response.statusCode).toBe(200);
    expect(userService.assertUserInLeaderSubtree).toHaveBeenCalledWith('leader-1', 'report-1');
    expect(deliverableService.listTeamDeliverablesForReview).toHaveBeenCalledWith(
      'report-1',
      'leader-1',
      '2026-05-01',
      '2026-05-29',
    );
    expect(response.json().deliverables).toHaveLength(1);

    await app.close();
  });
});
