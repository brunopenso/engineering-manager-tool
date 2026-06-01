import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as userService from '../../src/services/userService.js';
import { adminActorId, adminListAuthRoles } from './admin-users-filters.setup.js';
import { buildAdminUsersTestApp, registerAdminUsersTestRoutes } from './admin-users-test-app.js';

vi.mock('../../src/services/userService.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/userService.js')>();
  return {
    ...actual,
    findUsersForAdmin: vi.fn(),
  };
});

vi.mock('../../src/services/authUserMapper.js', () => ({
  mapUserToAuthResponse: vi.fn(async (user) => ({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    firstLoginAt: user.firstLoginAt.toISOString(),
    lastLoginAt: user.lastLoginAt.toISOString(),
    roles: ['COLLABORATOR', 'LEADER'],
  })),
}));

describe('US4 GET /users combined filters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(userService.findUsersForAdmin).mockResolvedValue([]);
  });

  it('forwards name, email, and roles together', async () => {
    const app = buildAdminUsersTestApp({
      userId: adminActorId,
      roles: adminListAuthRoles,
    });
    await registerAdminUsersTestRoutes(app);

    const response = await app.inject({
      method: 'GET',
      url: '/users?name=Bob&email=leader&roles=LEADER',
    });

    expect(response.statusCode).toBe(200);
    expect(userService.findUsersForAdmin).toHaveBeenCalledWith({
      name: 'Bob',
      email: 'leader',
      roles: ['LEADER'],
    });

    await app.close();
  });
});
