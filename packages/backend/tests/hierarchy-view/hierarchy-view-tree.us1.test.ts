import { beforeEach, describe, expect, it, vi } from 'vitest';
import { USER_ROLE_TYPES } from '../../src/auth/types.js';
import * as userService from '../../src/services/userService.js';
import {
  buildHierarchyTestApp,
  registerHierarchyTestRoutes,
} from '../hierarchy-management/hierarchy-test-app.js';

vi.mock('../../src/services/userService.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/userService.js')>();
  return {
    ...actual,
    getLeaderHierarchyView: vi.fn(),
  };
});

describe('US1 GET /users/leader/hierarchy-view', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns scoped hierarchy tree for leader', async () => {
    const app = buildHierarchyTestApp({
      userId: 'leader-1',
      roles: [USER_ROLE_TYPES.COLLABORATOR, USER_ROLE_TYPES.LEADER],
    });
    await registerHierarchyTestRoutes(app);

    vi.mocked(userService.getLeaderHierarchyView).mockResolvedValue({
      manager: {
        id: 'manager-1',
        displayName: 'Director Example',
        email: 'director@example.com',
        isLeader: true,
      },
      self: {
        id: 'leader-1',
        displayName: 'Team Leader',
        email: 'leader@example.com',
        isCurrentPosition: true,
        isLeader: true,
      },
      reports: [
        {
          id: 'report-1',
          displayName: 'Alice Report',
          email: 'alice@example.com',
          isLeader: false,
          children: [
            {
              id: 'report-2',
              displayName: 'Bob Report',
              email: 'bob@example.com',
              isLeader: true,
            },
          ],
        },
      ],
    });

    const response = await app.inject({
      method: 'GET',
      url: '/users/leader/hierarchy-view',
    });

    expect(response.statusCode).toBe(200);
    expect(userService.getLeaderHierarchyView).toHaveBeenCalledWith('leader-1');
    expect(response.json()).toEqual({
      manager: {
        id: 'manager-1',
        displayName: 'Director Example',
        email: 'director@example.com',
        isLeader: true,
      },
      self: {
        id: 'leader-1',
        displayName: 'Team Leader',
        email: 'leader@example.com',
        isCurrentPosition: true,
        isLeader: true,
      },
      reports: [
        {
          id: 'report-1',
          displayName: 'Alice Report',
          email: 'alice@example.com',
          isLeader: false,
          children: [
            {
              id: 'report-2',
              displayName: 'Bob Report',
              email: 'bob@example.com',
              isLeader: true,
            },
          ],
        },
      ],
    });

    await app.close();
  });
});
