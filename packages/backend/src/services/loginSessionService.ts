import type { FastifyInstance } from 'fastify';
import type { User } from '../database/entities/User.js';
import { mapUserToAuthResponse, type AuthUserResponse } from './authUserMapper.js';
import { createSuccessfulLoginAuditEvent } from './loginAuditService.js';

export type LoginSessionResponse = {
  accessToken: string;
  redirectPath: string;
  welcomeMessage: string;
  user: AuthUserResponse;
};

export async function completeLoginForUser(
  app: FastifyInstance,
  user: User,
): Promise<LoginSessionResponse> {
  await createSuccessfulLoginAuditEvent(user.id);

  const accessToken = app.issueAccessToken({
    sub: user.id,
    email: user.email,
    fullName: user.fullName,
  });

  return {
    accessToken,
    redirectPath: '/app',
    welcomeMessage: 'Welcome to the system',
    user: await mapUserToAuthResponse(user),
  };
}
