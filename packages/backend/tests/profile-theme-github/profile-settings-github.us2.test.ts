import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as userService from '../../src/services/userService.js';
import * as authUserMapper from '../../src/services/authUserMapper.js';
import { profileActorId, sampleProfileUser, toAuthUserResponse } from './profile-settings.setup.js';
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

describe('US2 profile github login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('saves, trims, and clears github login', async () => {
    const app = buildProfileSettingsTestApp({ userId: profileActorId });
    await registerProfileSettingsTestRoutes(app);

    vi.mocked(userService.updateUserProfileSettings)
      .mockResolvedValueOnce({ ...sampleProfileUser, githubLogin: 'acme-dev' } as never)
      .mockResolvedValueOnce({ ...sampleProfileUser, githubLogin: null } as never);
    vi.mocked(authUserMapper.mapUserToAuthResponse)
      .mockResolvedValueOnce(toAuthUserResponse({ ...sampleProfileUser, githubLogin: 'acme-dev' }))
      .mockResolvedValueOnce(toAuthUserResponse({ ...sampleProfileUser, githubLogin: null }));

    const saveResponse = await app.inject({
      method: 'PATCH',
      url: '/users/me',
      payload: { githubLogin: '  acme-dev  ' },
    });
    const clearResponse = await app.inject({
      method: 'PATCH',
      url: '/users/me',
      payload: { githubLogin: '' },
    });

    expect(saveResponse.statusCode).toBe(200);
    expect(saveResponse.json().user.githubLogin).toBe('acme-dev');
    expect(userService.updateUserProfileSettings).toHaveBeenNthCalledWith(1, profileActorId, {
      githubLogin: 'acme-dev',
    });
    expect(clearResponse.statusCode).toBe(200);
    expect(clearResponse.json().user.githubLogin).toBeNull();

    await app.close();
  });

  it('rejects invalid github login characters and overlong values', async () => {
    const app = buildProfileSettingsTestApp({ userId: profileActorId });
    await registerProfileSettingsTestRoutes(app);

    const invalidChars = await app.inject({
      method: 'PATCH',
      url: '/users/me',
      payload: { githubLogin: 'bad handle!' },
    });
    const overlong = await app.inject({
      method: 'PATCH',
      url: '/users/me',
      payload: { githubLogin: 'a'.repeat(40) },
    });

    expect(invalidChars.statusCode).toBe(400);
    expect(invalidChars.json().code).toBe(AUTH_ERROR_CODES.VALIDATION_ERROR);
    expect(overlong.statusCode).toBe(400);

    await app.close();
  });
});
