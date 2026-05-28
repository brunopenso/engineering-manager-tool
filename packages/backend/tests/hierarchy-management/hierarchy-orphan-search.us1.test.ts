import { beforeEach, describe, expect, it, vi } from 'vitest';
import { USER_ROLE_TYPES } from '../../src/auth/types.js';
import * as userService from '../../src/services/userService.js';
import { buildHierarchyTestApp, registerHierarchyTestRoutes } from './hierarchy-test-app.js';

vi.mock('../../src/services/userService.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/userService.js')>();
  return {
    ...actual,
    searchOrphanUsers: vi.fn(),
  };
});

describe('US1 GET /users/orphans', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns orphan users for leader and forwards query', async () => {
    const app = buildHierarchyTestApp({
      userId: 'leader-1',
      roles: [USER_ROLE_TYPES.COLLABORATOR, USER_ROLE_TYPES.LEADER],
    });
    await registerHierarchyTestRoutes(app);

    vi.mocked(userService.searchOrphanUsers).mockResolvedValue([
      {
        id: 'user-1',
        fullName: 'Alice Example',
        email: 'alice@example.com',
      },
    ]);

    const response = await app.inject({
      method: 'GET',
      url: '/users/orphans?query=ali',
    });

    expect(response.statusCode).toBe(200);
    expect(userService.searchOrphanUsers).toHaveBeenCalledWith({
      query: 'ali',
      excludeUserId: 'leader-1',
    });
    expect(response.json()).toEqual({
      users: [{ id: 'user-1', fullName: 'Alice Example', email: 'alice@example.com' }],
    });

    await app.close();
  });
});
