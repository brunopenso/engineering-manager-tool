import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as userService from '../../src/services/userService.js';
import { USER_ROLE_TYPES } from '../../src/auth/types.js';
import { collaboratorLeaderRoles } from '../../src/test/fixtures/roles.js';
import { adminActorId } from './admin-users-filters.setup.js';
import { buildAdminUsersTestApp, registerAdminUsersTestRoutes } from './admin-users-test-app.js';

vi.mock('../../src/services/userService.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/userService.js')>();
  return {
    ...actual,
    findUsersForAdmin: vi.fn(),
  };
});

describe('US4 GET /users filter authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 403 for non-administrator with filters', async () => {
    const app = buildAdminUsersTestApp({
      userId: adminActorId,
      roles: collaboratorLeaderRoles,
    });
    await registerAdminUsersTestRoutes(app);

    const response = await app.inject({
      method: 'GET',
      url: '/users?name=Alice&roles=LEADER',
    });

    expect(response.statusCode).toBe(403);
    expect(userService.findUsersForAdmin).not.toHaveBeenCalled();

    await app.close();
  });

  it('allows administrator with filters', async () => {
    const app = buildAdminUsersTestApp({
      userId: adminActorId,
      roles: [USER_ROLE_TYPES.COLLABORATOR, USER_ROLE_TYPES.ADMINISTRATOR],
    });
    await registerAdminUsersTestRoutes(app);

    vi.mocked(userService.findUsersForAdmin).mockResolvedValue([]);

    const response = await app.inject({
      method: 'GET',
      url: '/users?name=Alice',
    });

    expect(response.statusCode).toBe(200);
    expect(userService.findUsersForAdmin).toHaveBeenCalled();

    await app.close();
  });
});
