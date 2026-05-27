import { beforeEach, describe, expect, it, vi } from 'vitest';
import { USER_ROLE_TYPES } from '../auth/types.js';
import * as userService from '../services/userService.js';
import { buildHierarchyTestApp, registerHierarchyTestRoutes } from '../../tests/hierarchy-management/hierarchy-test-app.js';

vi.mock('../services/userService.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/userService.js')>();
  return {
    ...actual,
    searchOrphanUsers: vi.fn(),
  };
});

describe('hierarchy orphan search endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('supports query forwarding for leader search', async () => {
    const app = buildHierarchyTestApp({
      userId: 'leader-1',
      roles: [USER_ROLE_TYPES.COLLABORATOR, USER_ROLE_TYPES.LEADER],
    });
    await registerHierarchyTestRoutes(app);

    vi.mocked(userService.searchOrphanUsers).mockResolvedValue([]);

    const response = await app.inject({
      method: 'GET',
      url: '/users/orphans?query=exa',
    });

    expect(response.statusCode).toBe(200);
    expect(userService.searchOrphanUsers).toHaveBeenCalledWith({ query: 'exa' });
    await app.close();
  });

  it('returns orphan users with empty query', async () => {
    const app = buildHierarchyTestApp({
      userId: 'leader-1',
      roles: [USER_ROLE_TYPES.COLLABORATOR, USER_ROLE_TYPES.LEADER],
    });
    await registerHierarchyTestRoutes(app);

    vi.mocked(userService.searchOrphanUsers).mockResolvedValue([
      {
        id: 'user-2',
        fullName: 'No Leader User',
        email: 'orphan@example.com',
      },
    ]);

    const response = await app.inject({
      method: 'GET',
      url: '/users/orphans',
    });

    expect(response.statusCode).toBe(200);
    expect(userService.searchOrphanUsers).toHaveBeenCalledWith({ query: undefined });
    expect(response.json().users).toHaveLength(1);
    await app.close();
  });
});
