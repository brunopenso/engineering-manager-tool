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

describe('profile language preference settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('saves supported language preferences', async () => {
    const app = buildProfileSettingsTestApp({ userId: profileActorId });
    await registerProfileSettingsTestRoutes(app);

    vi.mocked(userService.updateUserProfileSettings)
      .mockResolvedValueOnce({ ...sampleProfileUser, languagePreference: 'es' } as never)
      .mockResolvedValueOnce({ ...sampleProfileUser, languagePreference: 'de' } as never);
    vi.mocked(authUserMapper.mapUserToAuthResponse)
      .mockResolvedValueOnce(toAuthUserResponse({ ...sampleProfileUser, languagePreference: 'es' }))
      .mockResolvedValueOnce(toAuthUserResponse({ ...sampleProfileUser, languagePreference: 'de' }));

    const spanishResponse = await app.inject({
      method: 'PATCH',
      url: '/users/me',
      payload: { languagePreference: 'es' },
    });
    const germanResponse = await app.inject({
      method: 'PATCH',
      url: '/users/me',
      payload: { languagePreference: 'de' },
    });

    expect(spanishResponse.statusCode).toBe(200);
    expect(spanishResponse.json().user.languagePreference).toBe('es');
    expect(germanResponse.statusCode).toBe(200);
    expect(germanResponse.json().user.languagePreference).toBe('de');

    await app.close();
  });

  it('rejects invalid language values', async () => {
    const app = buildProfileSettingsTestApp({ userId: profileActorId });
    await registerProfileSettingsTestRoutes(app);

    const response = await app.inject({
      method: 'PATCH',
      url: '/users/me',
      payload: { languagePreference: 'jp' },
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
      .mockResolvedValueOnce({ ...sampleProfileUser, dateFormatPreference: 'DMY' } as never)
      .mockResolvedValueOnce({ ...sampleProfileUser, dateFormatPreference: 'YMD' } as never);
    vi.mocked(authUserMapper.mapUserToAuthResponse)
      .mockResolvedValueOnce(toAuthUserResponse({ ...sampleProfileUser, dateFormatPreference: 'DMY' }))
      .mockResolvedValueOnce(toAuthUserResponse({ ...sampleProfileUser, dateFormatPreference: 'YMD' }));

    const dmyResponse = await app.inject({
      method: 'PATCH',
      url: '/users/me',
      payload: { dateFormatPreference: 'DMY' },
    });
    const ymdResponse = await app.inject({
      method: 'PATCH',
      url: '/users/me',
      payload: { dateFormatPreference: 'YMD' },
    });

    expect(dmyResponse.statusCode).toBe(200);
    expect(dmyResponse.json().user.dateFormatPreference).toBe('DMY');
    expect(ymdResponse.statusCode).toBe(200);
    expect(ymdResponse.json().user.dateFormatPreference).toBe('YMD');

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
