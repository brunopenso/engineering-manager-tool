import Fastify from 'fastify';
import type { UserRoleType } from '../auth/types.js';
import { registerDeliverablesRoutes } from '../routes/deliverables.js';

export function buildDeliverablesTestApp(options: {
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

export async function registerDeliverablesTestRoutes(
  app: ReturnType<typeof buildDeliverablesTestApp>,
) {
  await registerDeliverablesRoutes(app);
}
