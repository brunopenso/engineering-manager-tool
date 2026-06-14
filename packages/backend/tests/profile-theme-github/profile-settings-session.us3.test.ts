import Fastify from 'fastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_ERROR_CODES, type AppTokenPayload } from '../../src/auth/types.js';
import { registerAuthRoutes } from '../../src/routes/auth.js';
import * as userService from '../../src/services/userService.js';
import * as authUserMapper from '../../src/services/authUserMapper.js';
import {
  profileActorId,
  sampleProfileUser,
  toAuthUserResponse,
} from './profile-settings.setup.js';

vi.mock('../../src/services/userService.js', () => ({
  findUserById: vi.fn(),
  upsertUserFromGoogleIdentity: vi.fn(),
}));

vi.mock('../../src/services/authUserMapper.js', () => ({
  mapUserToAuthResponse: vi.fn(),
}));

describe('US3 session identity profile fields', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const decorateAuthHelpers = (app: ReturnType<typeof Fastify>, accessToken: string) => {
    app.decorate('issueAccessToken', (_payload: AppTokenPayload) => accessToken);
    app.decorate('verifyAccessToken', async (_token: string) => ({
      sub: profileActorId,
      email: sampleProfileUser.email,
      fullName: sampleProfileUser.fullName,
    }));
  };

  it('includes themePreference, githubLogin, languagePreference, and dateFormatPreference on refresh', async () => {
    const app = Fastify();
    app.addHook('onRequest', (request, _reply, done) => {
      request.auth = {
        userId: profileActorId,
        email: sampleProfileUser.email,
        fullName: sampleProfileUser.fullName,
        roles: ['COLLABORATOR'],
      };
      done();
    });
    decorateAuthHelpers(app, 'refreshed-token');
    await registerAuthRoutes(app);

    vi.mocked(userService.findUserById).mockResolvedValue({
      ...sampleProfileUser,
      themePreference: 'dark',
      githubLogin: 'acme-dev',
      languagePreference: 'es',
      dateFormatPreference: 'DMY',
    } as never);
    vi.mocked(authUserMapper.mapUserToAuthResponse).mockResolvedValue(
      toAuthUserResponse({
        ...sampleProfileUser,
        themePreference: 'dark',
        githubLogin: 'acme-dev',
        languagePreference: 'es',
        dateFormatPreference: 'DMY',
      }),
    );

    const response = await app.inject({ method: 'POST', url: '/auth/refresh' });
    const payload = response.json();

    expect(response.statusCode).toBe(200);
    expect(payload.user.themePreference).toBe('dark');
    expect(payload.user.githubLogin).toBe('acme-dev');
    expect(payload.user.languagePreference).toBe('es');
    expect(payload.user.dateFormatPreference).toBe('DMY');

    await app.close();
  });

  it('rejects refresh when authentication context is missing', async () => {
    const app = Fastify();
    decorateAuthHelpers(app, 'unused-token');
    await registerAuthRoutes(app);

    const response = await app.inject({ method: 'POST', url: '/auth/refresh' });

    expect(response.statusCode).toBe(401);
    expect(response.json().code).toBe(AUTH_ERROR_CODES.MISSING_APP_TOKEN);

    await app.close();
  });
});
