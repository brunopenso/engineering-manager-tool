import { beforeEach, describe, expect, it, vi } from 'vitest';
import { USER_ROLE_TYPES } from '../../src/auth/types.js';
import * as userService from '../../src/services/userService.js';
import { buildUsersTestApp, registerUsersTestRoutes } from './users-test-app.js';

vi.mock('../../src/services/userService.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/userService.js')>();
  return {
    ...actual,
    createUserByLeader: vi.fn(),
  };
});

describe('US3 POST /users leader override ignored', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('still assigns actor as leader when payload contains leaderId override', async () => {
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
        leaderId: 'different-leader-id',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(userService.createUserByLeader).toHaveBeenCalledWith(
      'leader-1',
      expect.objectContaining({ leaderId: 'different-leader-id' }),
    );

    await app.close();
  });
});
