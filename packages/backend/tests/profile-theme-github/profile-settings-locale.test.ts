import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as userService from '../../src/services/userService.js';
import * as authUserMapper from '../../src/services/authUserMapper.js';
import { profileActorId, sampleProfileUser, toAuthUserResponse } from './profile-settings.setup.js';
import {
  buildProfileSettingsTestApp,
  registerProfileSettingsTestRoutes,
} from './profile-settings-test-app.js';
import { AUTH_ERROR_CODES } from '../../src/auth/types.js';
import {
  DATE_FORMAT_PREFERENCE_DMY,
  DATE_FORMAT_PREFERENCE_YMD,
  LANGUAGE_PREFERENCES,
} from '../../src/types/profilePreferences.js';

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

describe('profile language preference settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('saves supported BCP 47 language preferences', async () => {
    const app = buildProfileSettingsTestApp({ userId: profileActorId });
    await registerProfileSettingsTestRoutes(app);

    vi.mocked(userService.updateUserProfileSettings)
      .mockResolvedValueOnce({
        ...sampleProfileUser,
        languagePreference: LANGUAGE_PREFERENCES[1],
      } as never)
      .mockResolvedValueOnce({
        ...sampleProfileUser,
        languagePreference: LANGUAGE_PREFERENCES[0],
      } as never);
    vi.mocked(authUserMapper.mapUserToAuthResponse)
      .mockResolvedValueOnce(
        toAuthUserResponse({ ...sampleProfileUser, languagePreference: LANGUAGE_PREFERENCES[1] }),
      )
      .mockResolvedValueOnce(
        toAuthUserResponse({ ...sampleProfileUser, languagePreference: LANGUAGE_PREFERENCES[0] }),
      );

    const portugueseResponse = await app.inject({
      method: 'PATCH',
      url: '/users/me',
      payload: { languagePreference: LANGUAGE_PREFERENCES[1] },
    });
    const englishResponse = await app.inject({
      method: 'PATCH',
      url: '/users/me',
      payload: { languagePreference: LANGUAGE_PREFERENCES[0] },
    });

    expect(portugueseResponse.statusCode).toBe(200);
    expect(portugueseResponse.json().user.languagePreference).toBe(LANGUAGE_PREFERENCES[1]);
    expect(englishResponse.statusCode).toBe(200);
    expect(englishResponse.json().user.languagePreference).toBe(LANGUAGE_PREFERENCES[0]);

    await app.close();
  });

  it('rejects invalid language values', async () => {
    const app = buildProfileSettingsTestApp({ userId: profileActorId });
    await registerProfileSettingsTestRoutes(app);

    const response = await app.inject({
      method: 'PATCH',
      url: '/users/me',
      payload: { languagePreference: 'pt-PT' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().code).toBe(AUTH_ERROR_CODES.VALIDATION_ERROR);

    await app.close();
  });
});

describe('profile date format preference settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('saves supported date format preferences', async () => {
    const app = buildProfileSettingsTestApp({ userId: profileActorId });
    await registerProfileSettingsTestRoutes(app);

    vi.mocked(userService.updateUserProfileSettings)
      .mockResolvedValueOnce({
        ...sampleProfileUser,
        dateFormatPreference: DATE_FORMAT_PREFERENCE_DMY,
      } as never)
      .mockResolvedValueOnce({
        ...sampleProfileUser,
        dateFormatPreference: DATE_FORMAT_PREFERENCE_YMD,
      } as never);
    vi.mocked(authUserMapper.mapUserToAuthResponse)
      .mockResolvedValueOnce(
        toAuthUserResponse({
          ...sampleProfileUser,
          dateFormatPreference: DATE_FORMAT_PREFERENCE_DMY,
        }),
      )
      .mockResolvedValueOnce(
        toAuthUserResponse({
          ...sampleProfileUser,
          dateFormatPreference: DATE_FORMAT_PREFERENCE_YMD,
        }),
      );

    const dmyResponse = await app.inject({
      method: 'PATCH',
      url: '/users/me',
      payload: { dateFormatPreference: DATE_FORMAT_PREFERENCE_DMY },
    });
    const ymdResponse = await app.inject({
      method: 'PATCH',
      url: '/users/me',
      payload: { dateFormatPreference: DATE_FORMAT_PREFERENCE_YMD },
    });

    expect(dmyResponse.statusCode).toBe(200);
    expect(dmyResponse.json().user.dateFormatPreference).toBe(DATE_FORMAT_PREFERENCE_DMY);
    expect(ymdResponse.statusCode).toBe(200);
    expect(ymdResponse.json().user.dateFormatPreference).toBe(DATE_FORMAT_PREFERENCE_YMD);

    await app.close();
  });

  it('rejects invalid date format values', async () => {
    const app = buildProfileSettingsTestApp({ userId: profileActorId });
    await registerProfileSettingsTestRoutes(app);

    const response = await app.inject({
      method: 'PATCH',
      url: '/users/me',
      payload: { dateFormatPreference: 'ISO' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().code).toBe(AUTH_ERROR_CODES.VALIDATION_ERROR);

    await app.close();
  });
});
