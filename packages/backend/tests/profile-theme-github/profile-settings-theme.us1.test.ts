import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as userService from '../../src/services/userService.js';
import * as authUserMapper from '../../src/services/authUserMapper.js';
import {
  profileActorId,
  sampleProfileUser,
  toAuthUserResponse,
} from './profile-settings.setup.js';
import {
  buildProfileSettingsTestApp,
  registerProfileSettingsTestRoutes,
} from './profile-settings-test-app.js';
import { AUTH_ERROR_CODES } from '../../src/auth/types.js';

vi.mock('../../src/services/userService.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/userService.js')>();
  return {
    ...actual,
    updateUserProfileSettings: vi.fn(),
  };
});

vi.mock('../../src/services/authUserMapper.js', () => ({
  mapUserToAuthResponse: vi.fn(),
}));

describe('US1 profile theme settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('saves dark and light theme preferences', async () => {
    const app = buildProfileSettingsTestApp({ userId: profileActorId });
    await registerProfileSettingsTestRoutes(app);

    vi.mocked(userService.updateUserProfileSettings)
      .mockResolvedValueOnce({ ...sampleProfileUser, themePreference: 'dark' } as never)
      .mockResolvedValueOnce({ ...sampleProfileUser, themePreference: 'light' } as never);
    vi.mocked(authUserMapper.mapUserToAuthResponse)
      .mockResolvedValueOnce(toAuthUserResponse({ ...sampleProfileUser, themePreference: 'dark' }))
      .mockResolvedValueOnce(toAuthUserResponse({ ...sampleProfileUser, themePreference: 'light' }));

    const darkResponse = await app.inject({
      method: 'PATCH',
      url: '/users/me',
      payload: { themePreference: 'dark' },
    });
    const lightResponse = await app.inject({
      method: 'PATCH',
      url: '/users/me',
      payload: { themePreference: 'light' },
    });

    expect(darkResponse.statusCode).toBe(200);
    expect(darkResponse.json().user.themePreference).toBe('dark');
    expect(lightResponse.statusCode).toBe(200);
    expect(lightResponse.json().user.themePreference).toBe('light');

    await app.close();
  });

  it('rejects invalid theme values', async () => {
    const app = buildProfileSettingsTestApp({ userId: profileActorId });
    await registerProfileSettingsTestRoutes(app);

    const response = await app.inject({
      method: 'PATCH',
      url: '/users/me',
      payload: { themePreference: 'neon' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().code).toBe(AUTH_ERROR_CODES.VALIDATION_ERROR);

    await app.close();
  });

  it('returns saved themePreference in mapped user response', async () => {
    vi.mocked(authUserMapper.mapUserToAuthResponse).mockResolvedValue(
      toAuthUserResponse({ ...sampleProfileUser, themePreference: 'dark' }),
    );

    const mapped = await authUserMapper.mapUserToAuthResponse({
      ...sampleProfileUser,
      themePreference: 'dark',
    } as never);

    expect(mapped.themePreference).toBe('dark');
  });
});
