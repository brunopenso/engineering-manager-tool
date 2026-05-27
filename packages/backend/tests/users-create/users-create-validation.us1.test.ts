import { beforeEach, describe, expect, it, vi } from 'vitest';
import { USER_ROLE_TYPES } from '../../src/auth/types.js';
import * as userService from '../../src/services/userService.js';
import { UserCreateValidationError } from '../../src/services/userCreateValidation.js';
import { buildUsersTestApp, registerUsersTestRoutes } from './users-test-app.js';

vi.mock('../../src/services/userService.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/userService.js')>();
  return {
    ...actual,
    createUserByLeader: vi.fn(),
  };
});

describe('US1 POST /users validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when required fields are missing', async () => {
    const app = buildUsersTestApp({
      userId: 'leader-1',
      roles: [USER_ROLE_TYPES.COLLABORATOR, USER_ROLE_TYPES.LEADER],
    });
    await registerUsersTestRoutes(app);

    vi.mocked(userService.createUserByLeader).mockRejectedValue(
      new UserCreateValidationError('Full name is required.'),
    );

    const response = await app.inject({
      method: 'POST',
      url: '/users',
      payload: { email: 'missing.name@example.com', role: 'COLLABORATOR' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });

    await app.close();
  });
});
