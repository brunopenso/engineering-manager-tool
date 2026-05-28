import { beforeEach, describe, expect, it, vi } from 'vitest';
import { USER_ROLE_TYPES } from '../../src/auth/types.js';
import * as userService from '../../src/services/userService.js';
import { buildHierarchyTestApp, registerHierarchyTestRoutes } from '../hierarchy-management/hierarchy-test-app.js';

vi.mock('../../src/services/userService.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/userService.js')>();
  return {
    ...actual,
    getLeaderHierarchyView: vi.fn(),
  };
});

describe('US3 hierarchy view access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns forbidden for non-leader', async () => {
    const app = buildHierarchyTestApp({
      userId: 'user-1',
      roles: [USER_ROLE_TYPES.COLLABORATOR],
    });
    await registerHierarchyTestRoutes(app);

    const response = await app.inject({
      method: 'GET',
      url: '/users/leader/hierarchy-view',
    });

    expect(response.statusCode).toBe(403);
    expect(userService.getLeaderHierarchyView).not.toHaveBeenCalled();

    await app.close();
  });

  it('returns unauthorized without auth', async () => {
    const app = buildHierarchyTestApp({
      userId: 'anonymous',
      includeAuth: false,
    });
    await registerHierarchyTestRoutes(app);

    const response = await app.inject({
      method: 'GET',
      url: '/users/leader/hierarchy-view',
    });

    expect(response.statusCode).toBe(401);

    await app.close();
  });
});
