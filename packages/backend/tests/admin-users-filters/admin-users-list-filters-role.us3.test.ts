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
    roles: ['COLLABORATOR'],
  })),
}));

describe('US3 GET /users role filters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(userService.findUsersForAdmin).mockResolvedValue([]);
  });

  it('forwards single role to service', async () => {
    const app = buildAdminUsersTestApp({
      userId: adminActorId,
      roles: adminListAuthRoles,
    });
    await registerAdminUsersTestRoutes(app);

    const response = await app.inject({
      method: 'GET',
      url: '/users?roles=LEADER',
    });

    expect(response.statusCode).toBe(200);
    expect(userService.findUsersForAdmin).toHaveBeenCalledWith({
      name: undefined,
      email: undefined,
      roles: ['LEADER'],
    });

    await app.close();
  });

  it('forwards multiple roles with OR semantics', async () => {
    const app = buildAdminUsersTestApp({
      userId: adminActorId,
      roles: adminListAuthRoles,
    });
    await registerAdminUsersTestRoutes(app);

    await app.inject({
      method: 'GET',
      url: '/users?roles=LEADER&roles=ADMINISTRATOR',
    });

    expect(userService.findUsersForAdmin).toHaveBeenCalledWith({
      name: undefined,
      email: undefined,
      roles: ['LEADER', 'ADMINISTRATOR'],
    });

    await app.close();
  });

  it('omits role filter when roles not provided', async () => {
    const app = buildAdminUsersTestApp({
      userId: adminActorId,
      roles: adminListAuthRoles,
    });
    await registerAdminUsersTestRoutes(app);

    await app.inject({ method: 'GET', url: '/users' });

    expect(userService.findUsersForAdmin).toHaveBeenCalledWith({});

    await app.close();
  });

  it('returns 400 for invalid role', async () => {
    const app = buildAdminUsersTestApp({
      userId: adminActorId,
      roles: adminListAuthRoles,
    });
    await registerAdminUsersTestRoutes(app);

    const response = await app.inject({
      method: 'GET',
      url: '/users?roles=SUPERUSER',
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      code: 'VALIDATION_ERROR',
    });
    expect(userService.findUsersForAdmin).not.toHaveBeenCalled();

    await app.close();
  });
});
