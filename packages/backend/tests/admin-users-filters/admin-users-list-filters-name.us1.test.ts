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

describe('US1 GET /users name filters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(userService.findUsersForAdmin).mockResolvedValue([]);
  });

  it('forwards full and partial name to service', async () => {
    const app = buildAdminUsersTestApp({
      userId: adminActorId,
      roles: adminListAuthRoles,
    });
    await registerAdminUsersTestRoutes(app);

    const response = await app.inject({
      method: 'GET',
      url: '/users?name=Alice',
    });

    expect(response.statusCode).toBe(200);
    expect(userService.findUsersForAdmin).toHaveBeenCalledWith({
      name: 'Alice',
      email: undefined,
      roles: undefined,
    });

    await app.close();
  });

  it('forwards partial name case-insensitively via parser trim', async () => {
    const app = buildAdminUsersTestApp({
      userId: adminActorId,
      roles: adminListAuthRoles,
    });
    await registerAdminUsersTestRoutes(app);

    await app.inject({
      method: 'GET',
      url: '/users?name=ali',
    });

    expect(userService.findUsersForAdmin).toHaveBeenCalledWith({
      name: 'ali',
      email: undefined,
      roles: undefined,
    });

    await app.close();
  });

  it('ignores name shorter than 3 characters', async () => {
    const app = buildAdminUsersTestApp({
      userId: adminActorId,
      roles: adminListAuthRoles,
    });
    await registerAdminUsersTestRoutes(app);

    await app.inject({
      method: 'GET',
      url: '/users?name=ab',
    });

    expect(userService.findUsersForAdmin).toHaveBeenCalledWith({});

    await app.close();
  });

  it('ignores whitespace-only name', async () => {
    const app = buildAdminUsersTestApp({
      userId: adminActorId,
      roles: adminListAuthRoles,
    });
    await registerAdminUsersTestRoutes(app);

    await app.inject({
      method: 'GET',
      url: '/users?name=%20%20',
    });

    expect(userService.findUsersForAdmin).toHaveBeenCalledWith({});

    await app.close();
  });
});
