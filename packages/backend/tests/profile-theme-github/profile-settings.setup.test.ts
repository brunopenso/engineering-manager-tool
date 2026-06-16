import {
  DEFAULT_DATE_FORMAT_PREFERENCE,
  DEFAULT_LANGUAGE_PREFERENCE,
} from '../../src/types/profilePreferences.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as userService from '../../src/services/userService.js';
import * as authUserMapper from '../../src/services/authUserMapper.js';
import {
  profileActorId,
  profileAuthRoles,
  sampleProfileUser,
  toAuthUserResponse,
} from './profile-settings.setup.js';
import {
  buildProfileSettingsTestApp,
  registerProfileSettingsTestRoutes,
} from './profile-settings-test-app.js';

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

describe('profile settings setup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns default theme and null github on mapped profile', async () => {
    vi.mocked(authUserMapper.mapUserToAuthResponse).mockResolvedValue(
      toAuthUserResponse(sampleProfileUser),
    );

    const mapped = await authUserMapper.mapUserToAuthResponse(sampleProfileUser as never);

    expect(mapped.themePreference).toBe('light');
    expect(mapped.githubLogin).toBeNull();
    expect(mapped.languagePreference).toBe(DEFAULT_LANGUAGE_PREFERENCE);
    expect(mapped.dateFormatPreference).toBe(DEFAULT_DATE_FORMAT_PREFERENCE);
    expect(mapped.roles).toEqual(profileAuthRoles);
  });

  it('exposes PATCH /users/me route for authenticated users', async () => {
    const app = buildProfileSettingsTestApp({ userId: profileActorId });
    await registerProfileSettingsTestRoutes(app);

    vi.mocked(userService.updateUserProfileSettings).mockResolvedValue({
      ...sampleProfileUser,
      themePreference: 'dark',
    } as never);
    vi.mocked(authUserMapper.mapUserToAuthResponse).mockResolvedValue(
      toAuthUserResponse({ ...sampleProfileUser, themePreference: 'dark' }),
    );

    const response = await app.inject({
      method: 'PATCH',
      url: '/users/me',
      payload: { themePreference: 'dark' },
    });

    expect(response.statusCode).toBe(200);
    expect(userService.updateUserProfileSettings).toHaveBeenCalledWith(profileActorId, {
      themePreference: 'dark',
    });

    await app.close();
  });

  it('accepts PATCH /users/me with an empty body', async () => {
    const app = buildProfileSettingsTestApp({ userId: profileActorId });
    await registerProfileSettingsTestRoutes(app);

    vi.mocked(userService.updateUserProfileSettings).mockResolvedValue(sampleProfileUser as never);
    vi.mocked(authUserMapper.mapUserToAuthResponse).mockResolvedValue(
      toAuthUserResponse(sampleProfileUser),
    );

    const response = await app.inject({
      method: 'PATCH',
      url: '/users/me',
      payload: {},
    });

    expect(response.statusCode).toBe(200);
    expect(userService.updateUserProfileSettings).toHaveBeenCalledWith(profileActorId, {});

    await app.close();
  });
});
