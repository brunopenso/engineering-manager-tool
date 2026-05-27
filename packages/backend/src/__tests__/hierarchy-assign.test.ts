import { beforeEach, describe, expect, it, vi } from 'vitest';
import { USER_ROLE_TYPES } from '../auth/types.js';
import * as userService from '../services/userService.js';
import { buildHierarchyTestApp, registerHierarchyTestRoutes } from '../../tests/hierarchy-management/hierarchy-test-app.js';

vi.mock('../services/userService.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/userService.js')>();
  return {
    ...actual,
    assignLeaderToOrphanUser: vi.fn(),
  };
});

describe('hierarchy assign endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('assigns eligible orphan user to authenticated leader', async () => {
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
    await app.close();
  });
});
