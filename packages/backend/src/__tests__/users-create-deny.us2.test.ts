import { describe, expect, it } from 'vitest';
import { USER_ROLE_TYPES } from '../auth/types.js';
import { buildUsersTestApp, registerUsersTestRoutes } from './users-test-app.js';

describe('US2 POST /users deny for non-leader', () => {
  it('returns 403 and does not allow collaborator-only actor', async () => {
    const app = buildUsersTestApp({
      userId: 'collab-1',
      roles: [USER_ROLE_TYPES.COLLABORATOR],
    });
    await registerUsersTestRoutes(app);

    const response = await app.inject({
      method: 'POST',
      url: '/users',
      payload: {
        fullName: 'Denied User',
        email: 'denied@example.com',
        role: 'COLLABORATOR',
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({
      code: 'USER_CREATE_FORBIDDEN',
    });

    await app.close();
  });
});
