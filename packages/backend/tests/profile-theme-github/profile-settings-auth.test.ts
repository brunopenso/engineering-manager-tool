import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildProfileSettingsTestApp,
  registerProfileSettingsTestRoutes,
} from './profile-settings-test-app.js';
import { AUTH_ERROR_CODES } from '../../src/auth/types.js';

describe('profile settings auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when PATCH /users/me is unauthenticated', async () => {
    const app = buildProfileSettingsTestApp({
      userId: 'unused',
      includeAuth: false,
    });
    await registerProfileSettingsTestRoutes(app);

    const response = await app.inject({
      method: 'PATCH',
      url: '/users/me',
      payload: { themePreference: 'dark' },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      code: AUTH_ERROR_CODES.MISSING_APP_TOKEN,
      message: 'Authentication token is missing.',
    });

    await app.close();
  });

  it('only exposes self-service path without user id parameter', async () => {
    const app = buildProfileSettingsTestApp({ userId: 'profile-actor-1' });
    await registerProfileSettingsTestRoutes(app);

    const response = await app.inject({
      method: 'PATCH',
      url: '/users/other-user-id',
      payload: { themePreference: 'dark' },
    });

    expect(response.statusCode).toBe(404);

    await app.close();
  });
});
