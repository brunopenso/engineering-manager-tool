import { beforeEach, describe, expect, it, vi } from 'vitest';
import { USER_ROLE_TYPES } from '../../src/auth/types.js';
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
  };
});

describe('team deliverables empty team', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty members list when leader has no reports', async () => {
    const app = buildTeamDeliverablesTestApp({
      userId: 'leader-1',
      roles: [USER_ROLE_TYPES.COLLABORATOR, USER_ROLE_TYPES.LEADER],
    });
    await registerTeamDeliverablesTestRoutes(app);

    vi.mocked(userService.getLeaderTeamMembers).mockResolvedValue({ members: [] });

    const response = await app.inject({
      method: 'GET',
      url: '/users/leader/team-members',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ members: [] });

    await app.close();
  });
});
