import Fastify from 'fastify';
import type { UserRoleType } from '../../src/auth/types.js';
import { registerUsersRoutes } from '../../src/routes/users.js';

export function buildUsersTestApp(options: {
  userId: string;
  roles?: UserRoleType[];
}) {
  const app = Fastify();

  app.addHook('onRequest', (request, _reply, done) => {
    request.auth = {
      userId: options.userId,
      email: `${options.userId}@example.com`,
      fullName: options.userId,
      roles: options.roles ?? ['COLLABORATOR'],
    };
    done();
  });

  return app;
}

export async function registerUsersTestRoutes(app: ReturnType<typeof buildUsersTestApp>) {
  await registerUsersRoutes(app);
}
