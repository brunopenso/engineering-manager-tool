import { beforeEach, describe, expect, it, vi } from 'vitest';
import { USER_ROLE_TYPES } from '../../src/auth/types.js';
import {
  buildLeaderAnalyticsTestApp,
  registerLeaderAnalyticsTestRoutes,
} from '../leader-analytics/leader-analytics-test-app.js';

describe('scope validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 for invalid scope values', async () => {
    const app = buildLeaderAnalyticsTestApp({
      userId: 'leader-1',
      roles: [USER_ROLE_TYPES.COLLABORATOR, USER_ROLE_TYPES.LEADER],
    });
    await registerLeaderAnalyticsTestRoutes(app);

    const response = await app.inject({
      method: 'GET',
      url: '/users/leader/team-analytics?startDate=2026-07-01&endDate=2026-08-12&userId=alice&scope=team',
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      code: 'VALIDATION_ERROR',
    });

    await app.close();
  });
});
