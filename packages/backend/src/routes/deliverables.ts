import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { AUTH_ERROR_CODES, type AuthErrorCode } from '../auth/types.js';
import {
  assertCanMutateDeliverable,
  assertCanReadDeliverables,
  assertLeaderRole,
} from '../services/authorizationService.js';
import { parseDeliverableListFilters } from '../services/deliverableListQuery.js';
import {
  countDeliverablesForOwner,
  createDeliverable,
  deleteDeliverable,
  getDeliverableById,
  listDeliverablesForOwner,
  mapDeliverableDetail,
  updateDeliverable,
} from '../services/deliverableService.js';
import {
  getReviewNotes,
  ReviewNotesValidationError,
  saveReviewNotes,
  setDeliverableReviewed,
} from '../services/deliverableReviewService.js';
import { assertUserInLeaderSubtree } from '../services/userService.js';
import {
  DeliverableValidationError,
  InvalidSystemTagError,
} from '../services/deliverableValidation.js';

type DeliverableBody = {
  title?: string;
  description?: string;
  roleInDeliverable?: string;
  systemTagIds?: string[];
  businessImpact?: string;
  improvementPoints?: string;
  technicalDescription?: string | null;
  userTags?: string[];
  links?: { url: string; label?: string | null }[];
};

type ReviewedBody = {
  reviewed?: boolean;
};

type ReviewNotesBody = {
  notes?: string;
};

function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  if (!request.auth) {
    reply.code(401);
    return null;
  }

  return request.auth;
}

function forbidden(
  reply: FastifyReply,
  code: AuthErrorCode = AUTH_ERROR_CODES.DELIVERABLE_FORBIDDEN,
) {
  reply.code(403);
  return {
    code,
    message: 'You do not have permission to perform this action.',
  };
}

function validationError(reply: FastifyReply, message: string, code = AUTH_ERROR_CODES.VALIDATION_ERROR) {
  reply.code(400);
  return { code, message };
}

function notFound(reply: FastifyReply) {
  reply.code(404);
  return {
    code: AUTH_ERROR_CODES.NOT_FOUND,
    message: 'Deliverable not found.',
  };
}

function parseDeliverableBody(body: DeliverableBody | undefined) {
  return {
    title: body?.title ?? '',
    description: body?.description ?? '',
    roleInDeliverable: body?.roleInDeliverable ?? '',
    systemTagIds: body?.systemTagIds ?? [],
    businessImpact: body?.businessImpact ?? '',
    improvementPoints: body?.improvementPoints ?? '',
    technicalDescription: body?.technicalDescription,
    userTags: body?.userTags,
    links: body?.links,
  };
}

function handleDeliverableError(error: unknown, reply: FastifyReply) {
  if (error instanceof DeliverableValidationError) {
    return validationError(reply, error.message);
  }

  if (error instanceof InvalidSystemTagError) {
    reply.code(400);
    return { code: AUTH_ERROR_CODES.INVALID_SYSTEM_TAG, message: error.message };
  }

  if (error instanceof Error && error.name === AUTH_ERROR_CODES.DELIVERABLE_FORBIDDEN) {
    return forbidden(reply);
  }

  throw error;
}

export async function registerDeliverablesRoutes(app: FastifyInstance): Promise<void> {
  app.get<{
    Querystring: {
      startDate?: string;
      endDate?: string;
      businessImpact?: string | string[];
      systemTagIds?: string | string[];
    };
  }>('/deliverables', async (request, reply) => {
    const auth = requireAuth(request, reply);
    if (!auth) {
      return {
        code: AUTH_ERROR_CODES.MISSING_APP_TOKEN,
        message: 'Authentication token is missing.',
      };
    }

    let filters;
    try {
      filters = parseDeliverableListFilters(request.query);
    } catch (error) {
      return handleDeliverableError(error, reply);
    }

    try {
      const deliverables = await listDeliverablesForOwner(auth.userId, filters);
      let hasAnyDeliverables = deliverables.length > 0;
      if (!hasAnyDeliverables) {
        hasAnyDeliverables = (await countDeliverablesForOwner(auth.userId)) > 0;
      }

      return { deliverables, hasAnyDeliverables };
    } catch (error) {
      return handleDeliverableError(error, reply);
    }
  });

  app.get<{ Params: { userId: string } }>('/users/:userId/deliverables', async (request, reply) => {
    const auth = requireAuth(request, reply);
    if (!auth) {
      return {
        code: AUTH_ERROR_CODES.MISSING_APP_TOKEN,
        message: 'Authentication token is missing.',
      };
    }

    const ownerUserId = request.params.userId;

    try {
      await assertCanReadDeliverables(auth.userId, ownerUserId);
    } catch {
      return forbidden(reply);
    }

    const deliverables = await listDeliverablesForOwner(ownerUserId);
    return {
      ownerUserId,
      readOnly: auth.userId !== ownerUserId,
      deliverables,
    };
  });

  app.get<{ Params: { deliverableId: string } }>(
    '/deliverables/:deliverableId',
    async (request, reply) => {
      const auth = requireAuth(request, reply);
      if (!auth) {
        return {
          code: AUTH_ERROR_CODES.MISSING_APP_TOKEN,
          message: 'Authentication token is missing.',
        };
      }

      const deliverable = await getDeliverableById(request.params.deliverableId);
      if (!deliverable) {
        return notFound(reply);
      }

      try {
        await assertCanReadDeliverables(auth.userId, deliverable.userId);
      } catch {
        return forbidden(reply);
      }

      return {
        readOnly: auth.userId !== deliverable.userId,
        deliverable: mapDeliverableDetail(deliverable),
      };
    },
  );

  app.post<{ Body: DeliverableBody }>('/deliverables', async (request, reply) => {
    const auth = requireAuth(request, reply);
    if (!auth) {
      return {
        code: AUTH_ERROR_CODES.MISSING_APP_TOKEN,
        message: 'Authentication token is missing.',
      };
    }

    try {
      const deliverable = await createDeliverable(auth.userId, parseDeliverableBody(request.body));
      reply.code(201);
      return { deliverable };
    } catch (error) {
      return handleDeliverableError(error, reply);
    }
  });

  app.patch<{ Params: { deliverableId: string }; Body: DeliverableBody }>(
    '/deliverables/:deliverableId',
    async (request, reply) => {
      const auth = requireAuth(request, reply);
      if (!auth) {
        return {
          code: AUTH_ERROR_CODES.MISSING_APP_TOKEN,
          message: 'Authentication token is missing.',
        };
      }

      const deliverable = await getDeliverableById(request.params.deliverableId);
      if (!deliverable) {
        return notFound(reply);
      }

      try {
        assertCanMutateDeliverable(auth.userId, deliverable.userId);
        const updated = await updateDeliverable(
          request.params.deliverableId,
          parseDeliverableBody(request.body),
        );
        if (!updated) {
          return notFound(reply);
        }
        return { deliverable: updated };
      } catch (error) {
        return handleDeliverableError(error, reply);
      }
    },
  );

  app.put<{ Params: { deliverableId: string }; Body: ReviewedBody }>(
    '/deliverables/:deliverableId/reviewed',
    async (request, reply) => {
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
        return forbidden(reply, AUTH_ERROR_CODES.LEADER_REQUIRED);
      }

      const deliverable = await getDeliverableById(request.params.deliverableId);
      if (!deliverable) {
        return notFound(reply);
      }

      try {
        await assertUserInLeaderSubtree(auth.userId, deliverable.userId);
      } catch {
        return forbidden(reply);
      }

      if (typeof request.body?.reviewed !== 'boolean') {
        return validationError(reply, 'reviewed must be a boolean value.');
      }

      const result = await setDeliverableReviewed(
        request.params.deliverableId,
        auth.userId,
        request.body.reviewed,
      );

      return result;
    },
  );

  app.get<{ Params: { deliverableId: string } }>(
    '/deliverables/:deliverableId/review-notes',
    async (request, reply) => {
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
        return forbidden(reply, AUTH_ERROR_CODES.LEADER_REQUIRED);
      }

      const deliverable = await getDeliverableById(request.params.deliverableId);
      if (!deliverable) {
        return notFound(reply);
      }

      try {
        await assertCanReadDeliverables(auth.userId, deliverable.userId);
      } catch {
        return forbidden(reply);
      }

      return getReviewNotes(request.params.deliverableId, auth.userId);
    },
  );

  app.put<{ Params: { deliverableId: string }; Body: ReviewNotesBody }>(
    '/deliverables/:deliverableId/review-notes',
    async (request, reply) => {
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
        return forbidden(reply, AUTH_ERROR_CODES.LEADER_REQUIRED);
      }

      const deliverable = await getDeliverableById(request.params.deliverableId);
      if (!deliverable) {
        return notFound(reply);
      }

      try {
        await assertCanReadDeliverables(auth.userId, deliverable.userId);
      } catch {
        return forbidden(reply);
      }

      if (typeof request.body?.notes !== 'string') {
        return validationError(reply, 'notes must be a string value.');
      }

      try {
        return await saveReviewNotes(
          request.params.deliverableId,
          auth.userId,
          request.body.notes,
        );
      } catch (error) {
        if (error instanceof ReviewNotesValidationError) {
          return validationError(reply, error.message);
        }

        throw error;
      }
    },
  );

  app.delete<{ Params: { deliverableId: string } }>(
    '/deliverables/:deliverableId',
    async (request, reply) => {
      const auth = requireAuth(request, reply);
      if (!auth) {
        return {
          code: AUTH_ERROR_CODES.MISSING_APP_TOKEN,
          message: 'Authentication token is missing.',
        };
      }

      const deliverable = await getDeliverableById(request.params.deliverableId);
      if (!deliverable) {
        return notFound(reply);
      }

      try {
        assertCanMutateDeliverable(auth.userId, deliverable.userId);
        const deleted = await deleteDeliverable(request.params.deliverableId);
        if (!deleted) {
          return notFound(reply);
        }
        reply.code(204);
        return null;
      } catch (error) {
        return handleDeliverableError(error, reply);
      }
    },
  );
}
