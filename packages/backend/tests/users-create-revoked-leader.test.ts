import { describe, expect, it } from 'vitest';
import { USER_ROLE_TYPES } from '../src/auth/types.js';
import { buildUsersTestApp, registerUsersTestRoutes } from './users-test-app.js';

describe('revoked leader create deny', () => {
  it('denies create when actor no longer has LEADER role', async () => {
    const app = buildUsersTestApp({
      userId: 'leader-1',
      roles: [USER_ROLE_TYPES.COLLABORATOR],
    });
    await registerUsersTestRoutes(app);

    const response = await app.inject({
      method: 'POST',
      url: '/users',
      payload: {
        fullName: 'Blocked User',
        email: 'blocked@example.com',
        role: 'COLLABORATOR',
      },
    });

    expect(response.statusCode).toBe(403);
    await app.close();
  });
});
