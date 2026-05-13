import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { AUTH_ERROR_CODES } from '../auth/types.js';

const PUBLIC_ROUTES = new Set([
  '/healthcheck',
  '/healthcheck/complete',
  '/auth/google/login',
]);

function getPathname(request: FastifyRequest): string {
  const rawUrl = request.raw.url ?? '/';
  return new URL(rawUrl, 'http://localhost').pathname;
}

function extractBearerToken(request: FastifyRequest): string | null {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    return null;
  }

  const [scheme, token] = authHeader.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token;
}

export async function registerAuthMiddleware(app: FastifyInstance): Promise<void> {
  app.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    const pathname = getPathname(request);

    if (PUBLIC_ROUTES.has(pathname)) {
      return;
    }

    const token = extractBearerToken(request);

    if (!token) {
      reply.code(401).send({
        code: AUTH_ERROR_CODES.MISSING_APP_TOKEN,
        message: 'Authentication token is missing.',
      });
      return;
    }

    try {
      await app.verifyAccessToken(token);
    } catch {
      reply.code(401).send({
        code: AUTH_ERROR_CODES.INVALID_APP_TOKEN,
        message: 'Authentication token is invalid.',
      });
    }
  });
}
