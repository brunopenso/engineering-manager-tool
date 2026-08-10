import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { AUTH_ERROR_CODES } from '../auth/types.js';
import {
  GithubPrQueryValidationError,
  queryImportedPullRequests,
  validateGithubPullRequestQueryInput,
} from '../services/githubPrQueryService.js';

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
    message: 'You do not have permission to view this GitHub activity.',
  };
}

export async function registerGithubPullRequestsRoutes(app: FastifyInstance): Promise<void> {
  app.post('/github-pull-requests/query', async (request, reply) => {
    const auth = requireAuth(request, reply);
    if (!auth) {
      return {
        code: AUTH_ERROR_CODES.MISSING_APP_TOKEN,
        message: 'Application token is required',
      };
    }

    let input;
    try {
      input = validateGithubPullRequestQueryInput(request.body);
    } catch (error) {
      reply.code(400);
      return {
        code: AUTH_ERROR_CODES.VALIDATION_ERROR,
        message: error instanceof Error ? error.message : 'Invalid request',
      };
    }

    try {
      const pullRequests = await queryImportedPullRequests(auth.userId, auth.roles, input);
      return { pullRequests };
    } catch (error) {
      if (error instanceof Error && error.name === AUTH_ERROR_CODES.FORBIDDEN) {
        return forbidden(reply);
      }
      if (error instanceof GithubPrQueryValidationError) {
        reply.code(400);
        return {
          code: AUTH_ERROR_CODES.VALIDATION_ERROR,
          message: error.message,
        };
      }
      throw error;
    }
  });
}
