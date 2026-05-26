import { beforeEach, describe, expect, it, vi } from 'vitest';
import { USER_ROLE_TYPES } from '../auth/types.js';
import * as userService from '../services/userService.js';
import { buildUsersTestApp, registerUsersTestRoutes } from './users-test-app.js';

vi.mock('../services/userService.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/userService.js')>();
  return {
    ...actual,
    createUserByLeader: vi.fn(),
  };
});

describe('US1 POST /users leader create', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a user and assigns creator as leader', async () => {
    const app = buildUsersTestApp({
      userId: 'leader-1',
      roles: [USER_ROLE_TYPES.COLLABORATOR, USER_ROLE_TYPES.LEADER],
    });
    await registerUsersTestRoutes(app);

    vi.mocked(userService.createUserByLeader).mockResolvedValue({
      id: 'user-2',
      fullName: 'New User',
      email: 'new.user@example.com',
      role: 'COLLABORATOR',
      leaderId: 'leader-1',
      createdByUserId: 'leader-1',
      createdAt: '2026-05-26T00:00:00.000Z',
    });

    const response = await app.inject({
      method: 'POST',
      url: '/users',
      payload: {
        fullName: 'New User',
        email: 'new.user@example.com',
        role: 'COLLABORATOR',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(userService.createUserByLeader).toHaveBeenCalledWith(
      'leader-1',
      expect.objectContaining({ email: 'new.user@example.com' }),
    );

    await app.close();
  });
});
