import { describe, expect, it } from 'vitest';
import { USER_ROLE_TYPES } from '../auth/types.js';
import { buildHierarchyTestApp, registerHierarchyTestRoutes } from '../../tests/hierarchy-management/hierarchy-test-app.js';

describe('hierarchy access deny', () => {
  it('returns forbidden for non-leader orphan search', async () => {
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

  it('returns unauthorized for unauthenticated assignment', async () => {
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
