import type { FastifyInstance } from 'fastify';
import { AUTH_ERROR_CODES } from '../auth/types.js';
import { mapUserToAuthResponse } from '../services/authUserMapper.js';
import { createSuccessfulLoginAuditEvent } from '../services/loginAuditService.js';
import { validateGoogleIdToken } from '../services/googleTokenValidator.js';
import { findUserById, upsertUserFromGoogleIdentity } from '../services/userService.js';

type GoogleLoginBody = {
  idToken?: string;
};

export async function registerAuthRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: GoogleLoginBody }>('/auth/google/login', async (request, reply) => {
    const idToken = request.body?.idToken;

    if (!idToken) {
      app.log.warn({ route: '/auth/google/login' }, 'Missing Google token');
      reply.code(401);
      return {
        code: AUTH_ERROR_CODES.INVALID_TOKEN,
        message: 'Google token is invalid.',
      };
    }

    const validation = await validateGoogleIdToken(idToken);

    if (!validation.ok) {
      app.log.warn(
        { route: '/auth/google/login', code: validation.error.code },
        'Google token validation failed',
      );
      reply.code(401);
      return validation.error;
    }

    const user = await upsertUserFromGoogleIdentity({
      email: validation.identity.email,
      fullName: validation.identity.fullName,
    });

    await createSuccessfulLoginAuditEvent(user.id);

    const accessToken = app.issueAccessToken({
      sub: user.id,
      email: user.email,
      fullName: user.fullName,
    });

    return {
      accessToken,
      redirectPath: '/welcome',
      welcomeMessage: 'Welcome to the system',
      user: mapUserToAuthResponse(user),
    };
  });

  app.get('/auth/me', async (request, reply) => {
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      app.log.warn({ route: '/auth/me' }, 'Missing app token');
      reply.code(401);
      return {
        code: AUTH_ERROR_CODES.MISSING_APP_TOKEN,
        message: 'Authentication token is missing.',
      };
    }

    try {
      const token = authHeader.slice('Bearer '.length);
      const payload = await app.verifyAccessToken(token);
      const user = await findUserById(payload.sub);

      if (!user) {
        app.log.warn({ route: '/auth/me', subject: payload.sub }, 'User not found for app token');
        reply.code(401);
        return {
          code: AUTH_ERROR_CODES.INVALID_APP_TOKEN,
          message: 'Authentication token is invalid.',
        };
      }

      return {
        user: mapUserToAuthResponse(user),
      };
    } catch {
      app.log.warn({ route: '/auth/me' }, 'App token verification failed');
      reply.code(401);
      return {
        code: AUTH_ERROR_CODES.INVALID_APP_TOKEN,
        message: 'Authentication token is invalid.',
      };
    }
  });
}
