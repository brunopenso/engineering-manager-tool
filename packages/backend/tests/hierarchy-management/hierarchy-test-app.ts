import Fastify from 'fastify';
import type { UserRoleType } from '../../src/auth/types.js';
import { registerUsersRoutes } from '../../src/routes/users.js';

export function buildHierarchyTestApp(options: {
  userId: string;
  roles?: UserRoleType[];
  includeAuth?: boolean;
}) {
  const app = Fastify();

  app.addHook('onRequest', (request, _reply, done) => {
    if (options.includeAuth === false) {
      done();
      return;
    }

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

export async function registerHierarchyTestRoutes(app: ReturnType<typeof buildHierarchyTestApp>) {
  await registerUsersRoutes(app);
}
