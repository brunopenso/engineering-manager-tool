import { beforeEach, describe, expect, it, vi } from 'vitest';
import { USER_ROLE_TYPES } from '../../src/auth/types.js';
import * as userService from '../../src/services/userService.js';
import { buildHierarchyTestApp, registerHierarchyTestRoutes } from './hierarchy-test-app.js';

vi.mock('../../src/services/userService.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/userService.js')>();
  return {
    ...actual,
    assignLeaderToOrphanUser: vi.fn(),
  };
});

describe('US1 POST /users/:userId/assign-leader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('assigns orphan user to logged-in leader', async () => {
    const app = buildHierarchyTestApp({
      userId: 'leader-1',
      roles: [USER_ROLE_TYPES.COLLABORATOR, USER_ROLE_TYPES.LEADER],
    });
    await registerHierarchyTestRoutes(app);

    vi.mocked(userService.assignLeaderToOrphanUser).mockResolvedValue({
      userId: 'user-2',
      leaderId: 'leader-1',
      updatedAt: '2026-05-27T00:00:00.000Z',
    });

    const response = await app.inject({
      method: 'POST',
      url: '/users/user-2/assign-leader',
    });

    expect(response.statusCode).toBe(200);
    expect(userService.assignLeaderToOrphanUser).toHaveBeenCalledWith('leader-1', 'user-2');

    await app.close();
  });
});
