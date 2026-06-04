import Fastify from 'fastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_ERROR_CODES, type AppTokenPayload } from '../../src/auth/types.js';
import { registerAuthRoutes } from '../../src/routes/auth.js';
import * as userService from '../../src/services/userService.js';
import * as authUserMapper from '../../src/services/authUserMapper.js';

vi.mock('../../src/services/userService.js', () => ({
  findUserById: vi.fn(),
  upsertUserFromGoogleIdentity: vi.fn(),
}));

vi.mock('../../src/services/authUserMapper.js', () => ({
  mapUserToAuthResponse: vi.fn(),
}));

describe('POST /auth/refresh', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const decorateAuthHelpers = (app: ReturnType<typeof Fastify>, accessToken: string) => {
    app.decorate('issueAccessToken', (_payload: AppTokenPayload) => accessToken);
    app.decorate('verifyAccessToken', async (_token: string) => ({
      sub: 'user-1',
      email: 'user@example.com',
      fullName: 'Test User',
    }));
  };

  it('returns refreshed session for authenticated users', async () => {
    const app = Fastify();
    app.addHook('onRequest', (request, _reply, done) => {
      request.auth = {
        userId: 'user-1',
        email: 'user@example.com',
        fullName: 'Test User',
        roles: ['COLLABORATOR'],
      };
      done();
    });
    decorateAuthHelpers(app, 'refreshed-token');
    await registerAuthRoutes(app);

    vi.mocked(userService.findUserById).mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      fullName: 'Test User',
      firstLoginAt: new Date('2026-01-01T00:00:00.000Z'),
      lastLoginAt: new Date('2026-01-01T00:00:00.000Z'),
      roleAssignments: [],
    } as never);
    vi.mocked(authUserMapper.mapUserToAuthResponse).mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      fullName: 'Test User',
      firstLoginAt: '2026-01-01T00:00:00.000Z',
      lastLoginAt: '2026-01-01T00:00:00.000Z',
      roles: ['COLLABORATOR'],
      themePreference: 'light',
      githubLogin: null,
    });

    const response = await app.inject({ method: 'POST', url: '/auth/refresh' });
    const payload = response.json();

    expect(response.statusCode).toBe(200);
    expect(payload.accessToken).toBe('refreshed-token');
    expect(payload.user.email).toBe('user@example.com');
    await app.close();
  });

  it('rejects refresh when authentication context is missing', async () => {
    const app = Fastify();
    decorateAuthHelpers(app, 'unused-token');
    await registerAuthRoutes(app);

    const response = await app.inject({ method: 'POST', url: '/auth/refresh' });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      code: AUTH_ERROR_CODES.MISSING_APP_TOKEN,
      message: 'Authentication token is missing.',
    });
    await app.close();
  });

  it('rejects refresh when user no longer exists', async () => {
    const app = Fastify();
    app.addHook('onRequest', (request, _reply, done) => {
      request.auth = {
        userId: 'missing-user',
        email: 'missing@example.com',
        fullName: 'Missing User',
        roles: ['COLLABORATOR'],
      };
      done();
    });
    decorateAuthHelpers(app, 'unused-token');
    await registerAuthRoutes(app);

    vi.mocked(userService.findUserById).mockResolvedValue(null);

    const response = await app.inject({ method: 'POST', url: '/auth/refresh' });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      code: AUTH_ERROR_CODES.INVALID_APP_TOKEN,
      message: 'Authentication token is invalid.',
    });
    await app.close();
  });
});
