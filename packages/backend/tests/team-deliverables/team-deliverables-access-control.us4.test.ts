import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_ERROR_CODES, USER_ROLE_TYPES } from '../../src/auth/types.js';
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

describe('US4 team deliverables access control', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated for team-members', async () => {
    const app = buildTeamDeliverablesTestApp({
      userId: 'leader-1',
      includeAuth: false,
    });
    await registerTeamDeliverablesTestRoutes(app);

    const response = await app.inject({
      method: 'GET',
      url: '/users/leader/team-members',
    });

    expect(response.statusCode).toBe(401);
    await app.close();
  });

  it('returns 403 for non-leader on team-members', async () => {
    const app = buildTeamDeliverablesTestApp({
      userId: 'collab-1',
      roles: [USER_ROLE_TYPES.COLLABORATOR],
    });
    await registerTeamDeliverablesTestRoutes(app);

    const response = await app.inject({
      method: 'GET',
      url: '/users/leader/team-members',
    });

    expect(response.statusCode).toBe(403);
    await app.close();
  });

  it('returns 403 when searching outside subtree', async () => {
    const app = buildTeamDeliverablesTestApp({
      userId: 'leader-1',
      roles: [USER_ROLE_TYPES.COLLABORATOR, USER_ROLE_TYPES.LEADER],
    });
    await registerTeamDeliverablesTestRoutes(app);

    vi.mocked(userService.assertUserInLeaderSubtree).mockRejectedValue(
      Object.assign(new Error('forbidden'), { name: AUTH_ERROR_CODES.FORBIDDEN }),
    );

    const response = await app.inject({
      method: 'GET',
      url: '/users/leader/team-deliverables?userId=outsider-1&startDate=2026-05-01&endDate=2026-05-29',
    });

    expect(response.statusCode).toBe(403);
    await app.close();
  });
});
