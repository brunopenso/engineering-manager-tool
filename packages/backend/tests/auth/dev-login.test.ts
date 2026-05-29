import Fastify from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_ERROR_CODES, type AppTokenPayload } from '../../src/auth/types.js';
import { registerDevAuthRoutes } from '../../src/routes/devAuth.js';
import * as loginSessionService from '../../src/services/loginSessionService.js';
import * as roleService from '../../src/services/roleService.js';
import * as userService from '../../src/services/userService.js';

vi.mock('../../src/services/userService.js', () => ({
  findAllUsers: vi.fn(),
  findUserById: vi.fn(),
  upsertUserFromGoogleIdentity: vi.fn(),
}));

vi.mock('../../src/services/roleService.js', () => ({
  loadRolesForUser: vi.fn(),
}));

vi.mock('../../src/services/loginSessionService.js', () => ({
  completeLoginForUser: vi.fn(),
}));

describe('dev auth routes', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const decorateAuthHelpers = (app: ReturnType<typeof Fastify>) => {
    app.decorate('issueAccessToken', (_payload: AppTokenPayload) => 'dev-token');
    app.decorate('verifyAccessToken', async (_token: string) => ({
      sub: 'user-1',
      email: 'user@example.com',
      fullName: 'Test User',
    }));
  };

  it('does not register routes when dev auth is disabled', async () => {
    process.env.NODE_ENV = 'development';
    process.env.DEV_AUTH_ENABLED = 'false';
    process.env.DEV_AUTH_SECRET = 'secret';

    const app = Fastify();
    decorateAuthHelpers(app);
    await registerDevAuthRoutes(app);

    const response = await app.inject({ method: 'GET', url: '/auth/dev/users' });

    expect(response.statusCode).toBe(404);
    await app.close();
  });

  it('rejects requests with missing dev auth secret', async () => {
    process.env.NODE_ENV = 'development';
    process.env.DEV_AUTH_ENABLED = 'true';
    process.env.DEV_AUTH_SECRET = 'secret';

    const app = Fastify();
    decorateAuthHelpers(app);
    await registerDevAuthRoutes(app);

    const response = await app.inject({ method: 'GET', url: '/auth/dev/users' });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      code: AUTH_ERROR_CODES.INVALID_TOKEN,
      message: 'Dev authentication secret is invalid.',
    });
    await app.close();
  });

  it('rejects requests with wrong dev auth secret', async () => {
    process.env.NODE_ENV = 'development';
    process.env.DEV_AUTH_ENABLED = 'true';
    process.env.DEV_AUTH_SECRET = 'secret';

    const app = Fastify();
    decorateAuthHelpers(app);
    await registerDevAuthRoutes(app);

    const response = await app.inject({
      method: 'GET',
      url: '/auth/dev/users',
      headers: { 'x-dev-auth-secret': 'wrong-secret' },
    });

    expect(response.statusCode).toBe(401);
    await app.close();
  });

  it('lists users with roles when dev auth is enabled', async () => {
    process.env.NODE_ENV = 'development';
    process.env.DEV_AUTH_ENABLED = 'true';
    process.env.DEV_AUTH_SECRET = 'secret';

    const app = Fastify();
    decorateAuthHelpers(app);
    await registerDevAuthRoutes(app);

    vi.mocked(userService.findAllUsers).mockResolvedValue([
      {
        id: 'user-1',
        email: 'leader@example.com',
        fullName: 'Team Leader',
      } as never,
    ]);
    vi.mocked(roleService.loadRolesForUser).mockResolvedValue(['COLLABORATOR', 'LEADER']);

    const response = await app.inject({
      method: 'GET',
      url: '/auth/dev/users',
      headers: { 'x-dev-auth-secret': 'secret' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      users: [
        {
          id: 'user-1',
          email: 'leader@example.com',
          fullName: 'Team Leader',
          roles: ['COLLABORATOR', 'LEADER'],
        },
      ],
    });
    await app.close();
  });

  it('logs in by existing userId', async () => {
    process.env.NODE_ENV = 'development';
    process.env.DEV_AUTH_ENABLED = 'true';
    process.env.DEV_AUTH_SECRET = 'secret';

    const app = Fastify();
    decorateAuthHelpers(app);
    await registerDevAuthRoutes(app);

    const user = {
      id: 'user-1',
      email: 'leader@example.com',
      fullName: 'Team Leader',
    };

    vi.mocked(userService.findUserById).mockResolvedValue(user as never);
    vi.mocked(loginSessionService.completeLoginForUser).mockResolvedValue({
      accessToken: 'dev-token',
      redirectPath: '/app',
      welcomeMessage: 'Welcome to the system',
      user: {
        id: 'user-1',
        email: 'leader@example.com',
        fullName: 'Team Leader',
        firstLoginAt: '2026-01-01T00:00:00.000Z',
        lastLoginAt: '2026-01-01T00:00:00.000Z',
        roles: ['COLLABORATOR', 'LEADER'],
      },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/auth/dev/login',
      headers: {
        'content-type': 'application/json',
        'x-dev-auth-secret': 'secret',
      },
      payload: { userId: 'user-1' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().accessToken).toBe('dev-token');
    expect(loginSessionService.completeLoginForUser).toHaveBeenCalledWith(
      expect.anything(),
      user,
    );
    await app.close();
  });

  it('creates a collaborator when logging in with a new email', async () => {
    process.env.NODE_ENV = 'development';
    process.env.DEV_AUTH_ENABLED = 'true';
    process.env.DEV_AUTH_SECRET = 'secret';

    const app = Fastify();
    decorateAuthHelpers(app);
    await registerDevAuthRoutes(app);

    const user = {
      id: 'user-2',
      email: 'new@example.com',
      fullName: 'New User',
    };

    vi.mocked(userService.upsertUserFromGoogleIdentity).mockResolvedValue(user as never);
    vi.mocked(loginSessionService.completeLoginForUser).mockResolvedValue({
      accessToken: 'dev-token',
      redirectPath: '/app',
      welcomeMessage: 'Welcome to the system',
      user: {
        id: 'user-2',
        email: 'new@example.com',
        fullName: 'New User',
        firstLoginAt: '2026-01-01T00:00:00.000Z',
        lastLoginAt: '2026-01-01T00:00:00.000Z',
        roles: ['COLLABORATOR'],
      },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/auth/dev/login',
      headers: {
        'content-type': 'application/json',
        'x-dev-auth-secret': 'secret',
      },
      payload: { email: 'new@example.com', fullName: 'New User' },
    });

    expect(response.statusCode).toBe(200);
    expect(userService.upsertUserFromGoogleIdentity).toHaveBeenCalledWith({
      email: 'new@example.com',
      fullName: 'New User',
    });
    expect(response.json().user.roles).toEqual(['COLLABORATOR']);
    await app.close();
  });

  it('returns 400 when neither userId nor email is provided', async () => {
    process.env.NODE_ENV = 'development';
    process.env.DEV_AUTH_ENABLED = 'true';
    process.env.DEV_AUTH_SECRET = 'secret';

    const app = Fastify();
    decorateAuthHelpers(app);
    await registerDevAuthRoutes(app);

    const response = await app.inject({
      method: 'POST',
      url: '/auth/dev/login',
      headers: {
        'content-type': 'application/json',
        'x-dev-auth-secret': 'secret',
      },
      payload: {},
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      code: AUTH_ERROR_CODES.VALIDATION_ERROR,
      message: 'Either userId or email is required.',
    });
    await app.close();
  });
});
