import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { AUTH_ERROR_CODES } from '../auth/types.js';
import { getDevAuthSecret, isDevAuthEnabled } from '../auth/devAuthConfig.js';
import { loadRolesForUser } from '../services/roleService.js';
import { completeLoginForUser } from '../services/loginSessionService.js';
import {
  findAllUsers,
  findUserById,
  upsertUserFromGoogleIdentity,
} from '../services/userService.js';

type DevLoginBody = {
  userId?: string;
  email?: string;
  fullName?: string;
};

function rejectDevAuthSecret(request: FastifyRequest, reply: FastifyReply): boolean {
  const expectedSecret = getDevAuthSecret();

  if (!expectedSecret) {
    reply.code(503);
    void reply.send({
      code: AUTH_ERROR_CODES.FORBIDDEN,
      message: 'Dev authentication is not configured.',
    });
    return true;
  }

  const providedSecret = request.headers['x-dev-auth-secret'];

  if (typeof providedSecret !== 'string' || providedSecret !== expectedSecret) {
    reply.code(401);
    void reply.send({
      code: AUTH_ERROR_CODES.INVALID_TOKEN,
      message: 'Dev authentication secret is invalid.',
    });
    return true;
  }

  return false;
}

export async function registerDevAuthRoutes(app: FastifyInstance): Promise<void> {
  if (!isDevAuthEnabled()) {
    return;
  }

  app.get('/auth/dev/users', async (request, reply) => {
    if (rejectDevAuthSecret(request, reply)) {
      return;
    }

    const users = await findAllUsers();
    const usersWithRoles = await Promise.all(
      users.map(async (user) => ({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        roles: await loadRolesForUser(user.id),
      })),
    );

    return { users: usersWithRoles };
  });

  app.post<{ Body: DevLoginBody }>('/auth/dev/login', async (request, reply) => {
    if (rejectDevAuthSecret(request, reply)) {
      return;
    }

    const { userId, email, fullName } = request.body ?? {};

    if (userId) {
      const user = await findUserById(userId);

      if (!user) {
        reply.code(404);
        return {
          code: AUTH_ERROR_CODES.NOT_FOUND,
          message: 'User not found.',
        };
      }

      return completeLoginForUser(app, user);
    }

    if (email?.trim()) {
      const user = await upsertUserFromGoogleIdentity({
        email: email.trim(),
        fullName: fullName?.trim() || email.trim(),
      });

      return completeLoginForUser(app, user);
    }

    reply.code(400);
    return {
      code: AUTH_ERROR_CODES.VALIDATION_ERROR,
      message: 'Either userId or email is required.',
    };
  });
}
