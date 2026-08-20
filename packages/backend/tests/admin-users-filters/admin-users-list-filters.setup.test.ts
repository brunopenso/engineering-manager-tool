import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as userService from '../../src/services/userService.js';
import * as authUserMapper from '../../src/services/authUserMapper.js';
import {
  adminActorId,
  adminListAuthRoles,
  sampleAdminListUser,
} from './admin-users-filters.setup.js';
import { buildAdminUsersTestApp, registerAdminUsersTestRoutes } from './admin-users-test-app.js';

vi.mock('../../src/services/userService.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/userService.js')>();
  return {
    ...actual,
    findUsersForAdmin: vi.fn(),
  };
});

vi.mock('../../src/services/authUserMapper.js', () => ({
  mapUserToAuthResponse: vi.fn(),
}));

describe('admin users list filters setup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns unfiltered users for administrator when no query params', async () => {
    const app = buildAdminUsersTestApp({
      userId: adminActorId,
      roles: adminListAuthRoles,
    });
    await registerAdminUsersTestRoutes(app);

    vi.mocked(userService.findUsersForAdmin).mockResolvedValue([sampleAdminListUser]);
    vi.mocked(authUserMapper.mapUserToAuthResponse).mockResolvedValue({
      id: sampleAdminListUser.id,
      email: sampleAdminListUser.email,
      fullName: sampleAdminListUser.fullName,
      firstLoginAt: sampleAdminListUser.firstLoginAt.toISOString(),
      lastLoginAt: sampleAdminListUser.lastLoginAt.toISOString(),
      roles: adminListAuthRoles,
      leader: null,
    } as never);

    const response = await app.inject({ method: 'GET', url: '/users' });

    expect(response.statusCode).toBe(200);
    expect(userService.findUsersForAdmin).toHaveBeenCalledWith({});

    await app.close();
  });
});
