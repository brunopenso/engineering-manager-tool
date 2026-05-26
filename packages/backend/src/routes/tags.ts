import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { AUTH_ERROR_CODES } from '../auth/types.js';
import { assertAdministrator } from '../services/authorizationService.js';
import { createTag, deleteTag, listTags, updateTag } from '../services/tagService.js';
import { TagDuplicateNameError, TagValidationError } from '../services/tagValidation.js';

type TagCreateBody = {
  name?: string;
  color?: string;
};

type TagUpdateBody = {
  name?: string;
  color?: string;
};

function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  if (!request.auth) {
    reply.code(401);
    return null;
  }

  return request.auth;
}

function forbidden(reply: FastifyReply) {
  reply.code(403);
  return {
    code: AUTH_ERROR_CODES.FORBIDDEN,
    message: 'You do not have permission to perform this action.',
  };
}

function validationError(reply: FastifyReply, message: string) {
  reply.code(400);
  return {
    code: AUTH_ERROR_CODES.VALIDATION_ERROR,
    message,
  };
}

function duplicateNameError(reply: FastifyReply, message: string) {
  reply.code(409);
  return {
    code: AUTH_ERROR_CODES.DUPLICATE_TAG_NAME,
    message,
  };
}

function notFound(reply: FastifyReply) {
  reply.code(404);
  return {
    code: AUTH_ERROR_CODES.NOT_FOUND,
    message: 'Tag not found.',
  };
}

export async function registerTagsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/tags', async (request, reply) => {
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

    return { tags: await listTags() };
  });

  app.post<{ Body: TagCreateBody }>('/tags', async (request, reply) => {
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

    try {
      if (!request.body?.name || !request.body?.color) {
        return validationError(reply, 'Name and color are required.');
      }

      const tag = await createTag({
        name: request.body.name,
        color: request.body.color,
      });
      reply.code(201);
      return { tag };
    } catch (error) {
      if (error instanceof TagDuplicateNameError) {
        return duplicateNameError(reply, error.message);
      }

      if (error instanceof TagValidationError) {
        return validationError(reply, error.message);
      }

      throw error;
    }
  });

  app.patch<{ Params: { tagId: string }; Body: TagUpdateBody }>(
    '/tags/:tagId',
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

      try {
        const tag = await updateTag(request.params.tagId, {
          name: request.body?.name,
          color: request.body?.color,
        });

        if (!tag) {
          return notFound(reply);
        }

        return { tag };
      } catch (error) {
        if (error instanceof TagDuplicateNameError) {
          return duplicateNameError(reply, error.message);
        }

        if (error instanceof TagValidationError) {
          return validationError(reply, error.message);
        }

        throw error;
      }
    },
  );

  app.delete<{ Params: { tagId: string } }>('/tags/:tagId', async (request, reply) => {
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

    const deleted = await deleteTag(request.params.tagId);
    if (!deleted) {
      return notFound(reply);
    }

    reply.code(204);
    return null;
  });
}
