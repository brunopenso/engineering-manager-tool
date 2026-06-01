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

describe('US2 GET /users email filters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(userService.findUsersForAdmin).mockResolvedValue([]);
  });

  it('forwards partial email to service', async () => {
    const app = buildAdminUsersTestApp({
      userId: adminActorId,
      roles: adminListAuthRoles,
    });
    await registerAdminUsersTestRoutes(app);

    const response = await app.inject({
      method: 'GET',
      url: '/users?email=example.com',
    });

    expect(response.statusCode).toBe(200);
    expect(userService.findUsersForAdmin).toHaveBeenCalledWith({
      name: undefined,
      email: 'example.com',
      roles: undefined,
    });

    await app.close();
  });

  it('combines name and email with AND semantics via filter object', async () => {
    const app = buildAdminUsersTestApp({
      userId: adminActorId,
      roles: adminListAuthRoles,
    });
    await registerAdminUsersTestRoutes(app);

    await app.inject({
      method: 'GET',
      url: '/users?name=Alice&email=alice@',
    });

    expect(userService.findUsersForAdmin).toHaveBeenCalledWith({
      name: 'Alice',
      email: 'alice@',
      roles: undefined,
    });

    await app.close();
  });
});
