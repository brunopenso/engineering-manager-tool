import { describe, expect, it } from 'vitest';
import { USER_ROLE_TYPES } from '../../src/auth/types.js';
import { buildHierarchyTestApp, registerHierarchyTestRoutes } from './hierarchy-test-app.js';

describe('US2 hierarchy management access deny', () => {
  it('denies orphan search for non-leader', async () => {
    const app = buildHierarchyTestApp({
      userId: 'user-1',
      roles: [USER_ROLE_TYPES.COLLABORATOR],
    });
    await registerHierarchyTestRoutes(app);

    const response = await app.inject({
      method: 'GET',
      url: '/users/orphans',
    });

    expect(response.statusCode).toBe(403);
    await app.close();
  });

  it('denies orphan assignment for unauthenticated request', async () => {
    const app = buildHierarchyTestApp({
      userId: 'anonymous',
      includeAuth: false,
    });
    await registerHierarchyTestRoutes(app);

    const response = await app.inject({
      method: 'POST',
      url: '/users/user-1/assign-leader',
    });

    expect(response.statusCode).toBe(401);
    await app.close();
  });
});
