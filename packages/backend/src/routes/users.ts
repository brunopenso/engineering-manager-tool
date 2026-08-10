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
  assertLeaderForHierarchyManagement,
  assertLeaderRole,
  hasAdministratorRole,
  hasLeaderRole,
  rejectCollaboratorRoleChange,
} from '../services/authorizationService.js';
import { mapUserToAuthResponse } from '../services/authUserMapper.js';
import { applyRoleChange } from '../services/roleService.js';
import {
  assignLeaderToOrphanUser,
  assertUserInLeaderSubtree,
  createUserByLeader,
  findAllUsers,
  findUsersForAdmin,
  findUserById,
  updateUserProfileSettings,
  getLeaderHierarchyView,
  getLeaderTeamMembers,
  searchOrphanUsers,
} from '../services/userService.js';
import { listTeamDeliverablesForReview } from '../services/deliverableService.js';
import { getLeaderTeamAnalytics } from '../services/leaderAnalyticsService.js';
import { TeamDeliverablesDateError } from '../services/teamDeliverablesDate.js';
import { UserCreateValidationError } from '../services/userCreateValidation.js';
import {
  AdminUserListValidationError,
  parseAdminUserListFilters,
} from '../services/adminUserListQuery.js';
import {
  UserProfileValidationError,
  parseProfileSettingsUpdate,
} from '../services/userProfileValidation.js';

type ProfileSettingsBody = {
  themePreference?: unknown;
  githubLogin?: unknown;
  languagePreference?: unknown;
  dateFormatPreference?: unknown;
};

type RoleChangeBody = {
  role?: string;
  action?: string;
};

type LeaderCreateUserBody = {
  fullName?: string;
  email?: string;
  role?: string;
  leaderId?: string | null;
};

type OrphanSearchQuery = {
  query?: string;
};

type AdminUserListQuery = {
  name?: string;
  email?: string;
  roles?: string | string[];
};

type TeamDeliverablesQuery = {
  userId?: string;
  startDate?: string;
  endDate?: string;
};

type TeamAnalyticsQuery = {
  userId?: string;
  startDate?: string;
  endDate?: string;
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
  app.patch<{ Body: ProfileSettingsBody }>('/users/me', async (request, reply) => {
    const auth = requireAuth(request, reply);
    if (!auth) {
      return {
        code: AUTH_ERROR_CODES.MISSING_APP_TOKEN,
        message: 'Authentication token is missing.',
      };
    }

    try {
      const partial = parseProfileSettingsUpdate(request.body ?? {});
      const user = await updateUserProfileSettings(auth.userId, partial);

      return {
        user: await mapUserToAuthResponse(user),
      };
    } catch (error) {
      if (error instanceof UserProfileValidationError) {
        return validationError(reply, error.message);
      }

      if (error instanceof Error && error.name === AUTH_ERROR_CODES.NOT_FOUND) {
        return notFound(reply);
      }

      throw error;
    }
  });

  app.post<{ Body: LeaderCreateUserBody }>('/users', async (request, reply) => {
    const auth = requireAuth(request, reply);
    if (!auth) {
      return {
        code: AUTH_ERROR_CODES.MISSING_APP_TOKEN,
        message: 'Authentication token is missing.',
      };
    }

    try {
      assertLeaderRole(auth.roles);
    } catch {
      reply.code(403);
      return {
        code: AUTH_ERROR_CODES.USER_CREATE_FORBIDDEN,
        message: 'Only leaders can create users.',
      };
    }

    try {
      const user = await createUserByLeader(auth.userId, request.body ?? {});
      reply.code(201);
      return { user };
    } catch (error) {
      if (
        error instanceof UserCreateValidationError ||
        (error instanceof Error && error.name === AUTH_ERROR_CODES.VALIDATION_ERROR)
      ) {
        return validationError(reply, error.message);
      }

      throw error;
    }
  });

  app.get<{ Querystring: OrphanSearchQuery }>('/users/orphans', async (request, reply) => {
    const auth = requireAuth(request, reply);
    if (!auth) {
      return {
        code: AUTH_ERROR_CODES.MISSING_APP_TOKEN,
        message: 'Authentication token is missing.',
      };
    }

    try {
      assertLeaderForHierarchyManagement(auth.roles);
    } catch {
      return forbidden(reply);
    }

    const users = await searchOrphanUsers({
      query: request.query?.query,
      excludeUserId: auth.userId,
    });
    return { users };
  });

  app.post<{ Params: { userId: string } }>(
    '/users/:userId/assign-leader',
    async (request, reply) => {
      const auth = requireAuth(request, reply);
      if (!auth) {
        return {
          code: AUTH_ERROR_CODES.MISSING_APP_TOKEN,
          message: 'Authentication token is missing.',
        };
      }

      try {
        assertLeaderForHierarchyManagement(auth.roles);
      } catch {
        return forbidden(reply);
      }

      try {
        const assignment = await assignLeaderToOrphanUser(auth.userId, request.params.userId);
        return assignment;
      } catch (error) {
        if (error instanceof Error && error.name === AUTH_ERROR_CODES.NOT_FOUND) {
          return notFound(reply);
        }

        if (error instanceof Error && error.name === AUTH_ERROR_CODES.VALIDATION_ERROR) {
          return validationError(reply, error.message);
        }

        throw error;
      }
    },
  );

  app.get<{ Querystring: AdminUserListQuery }>('/users', async (request, reply) => {
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

    let filters;
    try {
      filters = parseAdminUserListFilters(request.query ?? {});
    } catch (error) {
      if (error instanceof AdminUserListValidationError) {
        return validationError(reply, error.message);
      }

      throw error;
    }

    const users = await findUsersForAdmin(filters);
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

  app.get('/users/leader/team-members', async (request, reply) => {
    const auth = requireAuth(request, reply);
    if (!auth) {
      return {
        code: AUTH_ERROR_CODES.MISSING_APP_TOKEN,
        message: 'Authentication token is missing.',
      };
    }

    try {
      assertLeaderForHierarchyManagement(auth.roles);
    } catch {
      return forbidden(reply);
    }

    return getLeaderTeamMembers(auth.userId);
  });

  app.get<{ Querystring: TeamDeliverablesQuery }>(
    '/users/leader/team-deliverables',
    async (request, reply) => {
      const auth = requireAuth(request, reply);
      if (!auth) {
        return {
          code: AUTH_ERROR_CODES.MISSING_APP_TOKEN,
          message: 'Authentication token is missing.',
        };
      }

      try {
        assertLeaderForHierarchyManagement(auth.roles);
      } catch {
        return forbidden(reply);
      }

      const ownerUserId = request.query.userId?.trim();
      const startDate = request.query.startDate?.trim();
      const endDate = request.query.endDate?.trim();

      if (!ownerUserId || !startDate || !endDate) {
        return validationError(
          reply,
          'userId, startDate, and endDate query parameters are required.',
        );
      }

      try {
        await assertUserInLeaderSubtree(auth.userId, ownerUserId);
      } catch {
        return forbidden(reply);
      }

      try {
        const deliverables = await listTeamDeliverablesForReview(
          ownerUserId,
          auth.userId,
          startDate,
          endDate,
        );

        return {
          ownerUserId,
          deliverables,
        };
      } catch (error) {
        if (error instanceof TeamDeliverablesDateError) {
          return validationError(reply, error.message);
        }

        throw error;
      }
    },
  );

  app.get<{ Querystring: TeamAnalyticsQuery }>(
    '/users/leader/team-analytics',
    async (request, reply) => {
      const auth = requireAuth(request, reply);
      if (!auth) {
        return {
          code: AUTH_ERROR_CODES.MISSING_APP_TOKEN,
          message: 'Authentication token is missing.',
        };
      }

      try {
        assertLeaderForHierarchyManagement(auth.roles);
      } catch {
        return forbidden(reply);
      }

      const startDate = request.query.startDate?.trim();
      const endDate = request.query.endDate?.trim();
      const userId = request.query.userId?.trim();

      if (!startDate || !endDate) {
        return validationError(reply, 'startDate and endDate query parameters are required.');
      }

      if (userId) {
        try {
          await assertUserInLeaderSubtree(auth.userId, userId);
        } catch {
          return forbidden(reply);
        }
      }

      try {
        return await getLeaderTeamAnalytics(auth.userId, {
          startDate,
          endDate,
          ...(userId ? { userId } : {}),
        });
      } catch (error) {
        if (error instanceof TeamDeliverablesDateError) {
          return validationError(reply, error.message);
        }

        throw error;
      }
    },
  );

  app.get('/users/leader/hierarchy-view', async (request, reply) => {
    const auth = requireAuth(request, reply);
    if (!auth) {
      return {
        code: AUTH_ERROR_CODES.MISSING_APP_TOKEN,
        message: 'Authentication token is missing.',
      };
    }

    try {
      assertLeaderForHierarchyManagement(auth.roles);
    } catch {
      return forbidden(reply);
    }

    try {
      return await getLeaderHierarchyView(auth.userId);
    } catch (error) {
      if (error instanceof Error && error.name === AUTH_ERROR_CODES.NOT_FOUND) {
        return notFound(reply);
      }

      throw error;
    }
  });

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
      message:
        'Leader role is active. Organizational hierarchy access is available for this session.',
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
