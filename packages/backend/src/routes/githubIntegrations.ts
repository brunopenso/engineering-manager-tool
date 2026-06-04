import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { AUTH_ERROR_CODES } from '../auth/types.js';
import { assertAdministrator } from '../services/authorizationService.js';
import {
  disableGithubIntegration,
  enableGithubIntegration,
  listGithubIntegrations,
  mapGithubIntegration,
} from '../services/githubIntegrationService.js';
import {
  GithubIntegrationDuplicateLoginError,
  GithubIntegrationValidationError,
} from '../services/githubIntegrationValidation.js';

type EnableBody = {
  organizationName?: unknown;
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

function duplicateLoginError(reply: FastifyReply, message: string) {
  reply.code(409);
  return {
    code: AUTH_ERROR_CODES.DUPLICATE_GITHUB_INTEGRATION_LOGIN,
    message,
  };
}

function notFound(reply: FastifyReply) {
  reply.code(404);
  return {
    code: AUTH_ERROR_CODES.NOT_FOUND,
    message: 'GitHub integration not found.',
  };
}

export async function registerGithubIntegrationsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/github-integrations', async (request, reply) => {
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

    const integrations = await listGithubIntegrations();
    return {
      integrations: integrations.map(mapGithubIntegration),
    };
  });

  app.post<{ Body: EnableBody }>('/github-integrations', async (request, reply) => {
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
      if (request.body?.organizationName === undefined) {
        return validationError(reply, 'Organization name is required.');
      }

      const integration = await enableGithubIntegration(request.body.organizationName);
      reply.code(201);
      return { integration: mapGithubIntegration(integration) };
    } catch (error) {
      if (error instanceof GithubIntegrationDuplicateLoginError) {
        return duplicateLoginError(reply, error.message);
      }

      if (error instanceof GithubIntegrationValidationError) {
        return validationError(reply, error.message);
      }

      throw error;
    }
  });

  app.delete<{ Params: { integrationId: string } }>(
    '/github-integrations/:integrationId',
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

      const deleted = await disableGithubIntegration(request.params.integrationId);
      if (!deleted) {
        return notFound(reply);
      }

      reply.code(204);
      return null;
    },
  );
}
