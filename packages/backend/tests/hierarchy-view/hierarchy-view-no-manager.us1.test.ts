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

describe('US1 hierarchy view without manager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null manager for top-level leader', async () => {
    const app = buildHierarchyTestApp({
      userId: 'leader-top',
      roles: [USER_ROLE_TYPES.COLLABORATOR, USER_ROLE_TYPES.LEADER],
    });
    await registerHierarchyTestRoutes(app);

    vi.mocked(userService.getLeaderHierarchyView).mockResolvedValue({
      manager: null,
      self: {
        id: 'leader-top',
        displayName: 'Top Leader',
        email: 'top@example.com',
        isCurrentPosition: true,
        isLeader: true,
      },
      reports: [],
    });

    const response = await app.inject({
      method: 'GET',
      url: '/users/leader/hierarchy-view',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().manager).toBeNull();

    await app.close();
  });
});
