import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import {
  AUTH_ERROR_CODES,
  ELEVATED_ROLE_TYPES,
  USER_ROLE_TYPES,
  type ElevatedRoleType,
  type RoleChangeAction,
} from '../auth/types.js';
import {
  assertAdministrator,
  hasAdministratorRole,
  hasLeaderRole,
  rejectCollaboratorRoleChange,
} from '../services/authorizationService.js';
import { mapUserToAuthResponse } from '../services/authUserMapper.js';
import { applyRoleChange } from '../services/roleService.js';
import { findAllUsers, findUserById } from '../services/userService.js';

type RoleChangeBody = {
  role?: string;
  action?: string;
};

function forbidden(reply: FastifyReply) {
  reply.code(403);
  return {
    code: AUTH_ERROR_CODES.FORBIDDEN,
    message: 'You do not have permission to perform this action.',
  };
}

function notFound(reply: FastifyReply) {
  reply.code(404);
  return {
    code: AUTH_ERROR_CODES.NOT_FOUND,
    message: 'User not found.',
  };
}

function validationError(reply: FastifyReply, message: string) {
  reply.code(400);
  return {
    code: AUTH_ERROR_CODES.VALIDATION_ERROR,
    message,
  };
}

function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  if (!request.auth) {
    reply.code(401);
    return null;
  }

  return request.auth;
}

export async function registerUsersRoutes(app: FastifyInstance): Promise<void> {
  app.get('/users', async (request, reply) => {
    const auth = requireAuth(request, reply);
    if (!auth) {
      return {
        code: AUTH_ERROR_CODES.MISSING_APP_TOKEN,
        message: 'Authentication token is missing.',
      };
    }

    try {
      assertAdministrator(auth.roles);
    } catch {
      return forbidden(reply);
    }

    const users = await findAllUsers();
    const mappedUsers = await Promise.all(users.map((user) => mapUserToAuthResponse(user)));

    return { users: mappedUsers };
  });

  app.get<{ Params: { userId: string } }>('/users/:userId', async (request, reply) => {
    const auth = requireAuth(request, reply);
    if (!auth) {
      return {
        code: AUTH_ERROR_CODES.MISSING_APP_TOKEN,
        message: 'Authentication token is missing.',
      };
    }

    try {
      assertAdministrator(auth.roles);
    } catch {
      return forbidden(reply);
    }

    const user = await findUserById(request.params.userId);

    if (!user) {
      return notFound(reply);
    }

    return {
      user: await mapUserToAuthResponse(user),
    };
  });

  app.patch<{ Params: { userId: string }; Body: RoleChangeBody }>(
    '/users/:userId/roles',
    async (request, reply) => {
      const auth = requireAuth(request, reply);
      if (!auth) {
        return {
          code: AUTH_ERROR_CODES.MISSING_APP_TOKEN,
          message: 'Authentication token is missing.',
        };
      }

      try {
        assertAdministrator(auth.roles);
      } catch {
        return forbidden(reply);
      }

      const role = request.body?.role;
      const action = request.body?.action;

      if (!role || !action) {
        return validationError(reply, 'Role and action are required.');
      }

      try {
        rejectCollaboratorRoleChange(role);
      } catch {
        return validationError(reply, 'Collaborator role cannot be changed.');
      }

      if (!ELEVATED_ROLE_TYPES.includes(role as ElevatedRoleType)) {
        return validationError(reply, 'Only LEADER and ADMINISTRATOR roles can be changed.');
      }

      if (action !== 'GRANT' && action !== 'REVOKE') {
        return validationError(reply, 'Action must be GRANT or REVOKE.');
      }

      const targetUser = await findUserById(request.params.userId);

      if (!targetUser) {
        return notFound(reply);
      }

      await applyRoleChange(
        auth.userId,
        targetUser.id,
        role as ElevatedRoleType,
        action as RoleChangeAction,
      );

      return {
        user: await mapUserToAuthResponse(targetUser),
      };
    },
  );

  app.get('/users/leader/scope-check', async (request, reply) => {
    const auth = requireAuth(request, reply);
    if (!auth) {
      return {
        code: AUTH_ERROR_CODES.MISSING_APP_TOKEN,
        message: 'Authentication token is missing.',
      };
    }

    if (!hasLeaderRole(auth.roles)) {
      return forbidden(reply);
    }

    return {
      allowed: true,
      message: 'Leader role is active. Organizational hierarchy resolver is not configured yet.',
    };
  });

  app.get('/users/admin/scope-check', async (request, reply) => {
    const auth = requireAuth(request, reply);
    if (!auth) {
      return {
        code: AUTH_ERROR_CODES.MISSING_APP_TOKEN,
        message: 'Authentication token is missing.',
      };
    }

    if (!hasAdministratorRole(auth.roles)) {
      return forbidden(reply);
    }

    return {
      allowed: true,
      message: 'Administrator capabilities are available for this session.',
    };
  });
}
