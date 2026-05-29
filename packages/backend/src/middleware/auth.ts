import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { getDevAuthPublicRoutes, isDevAuthEnabled } from '../auth/devAuthConfig.js';
import { AUTH_ERROR_CODES } from '../auth/types.js';
import { loadRolesForUser } from '../services/roleService.js';

const BASE_PUBLIC_ROUTES = new Set([
  '/healthcheck',
  '/healthcheck/complete',
  '/auth/google/login',
]);

function isPublicRoute(pathname: string): boolean {
  if (BASE_PUBLIC_ROUTES.has(pathname)) {
    return true;
  }

  return isDevAuthEnabled() && getDevAuthPublicRoutes().includes(pathname);
}

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

    if (isPublicRoute(pathname)) {
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
      const payload = await app.verifyAccessToken(token);
      const roles = await loadRolesForUser(payload.sub);

      request.auth = {
        userId: payload.sub,
        email: payload.email,
        fullName: payload.fullName,
        roles,
      };
    } catch {
      reply.code(401).send({
        code: AUTH_ERROR_CODES.INVALID_APP_TOKEN,
        message: 'Authentication token is invalid.',
      });
    }
  });
}
