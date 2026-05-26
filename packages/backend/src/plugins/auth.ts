import jwt from '@fastify/jwt';
import type { FastifyInstance } from 'fastify';
import type { AppTokenPayload } from '../auth/types.js';

declare module 'fastify' {
  interface FastifyInstance {
    issueAccessToken: (payload: AppTokenPayload) => string;
    verifyAccessToken: (token: string) => Promise<AppTokenPayload>;
  }
}

const DEFAULT_TOKEN_TTL = '48h';

export async function registerAuthPlugin(app: FastifyInstance): Promise<void> {
  const secret = process.env.APP_AUTH_SECRET;

  if (!secret) {
    throw new Error('APP_AUTH_SECRET is required for authentication');
  }

  await app.register(jwt, {
    secret,
    sign: {
      expiresIn: process.env.APP_AUTH_TOKEN_TTL ?? DEFAULT_TOKEN_TTL,
    },
  });

  app.decorate('issueAccessToken', (payload: AppTokenPayload) => {
    return app.jwt.sign(payload);
  });

  app.decorate('verifyAccessToken', async (token: string) => {
    const verified = await app.jwt.verify<AppTokenPayload>(token);
    return verified;
  });
}
