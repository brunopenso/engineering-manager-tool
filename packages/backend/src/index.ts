// This should execute first to load environment variables before anything else
import dotenv from 'dotenv';
dotenv.config();

import 'reflect-metadata';
import Fastify from 'fastify';
import { initializeDatabase, closeDatabase } from './database/connection.js';
import { registerAuthMiddleware } from './middleware/auth.js';
import { registerAuthPlugin } from './plugins/auth.js';
import { registerAuthRoutes } from './routes/auth.js';
import { registerHealthcheckRoutes } from './routes/healthcheck.js';
import { registerUsersRoutes } from './routes/users.js';


const app = Fastify({ logger: true });
const PORT = Number(process.env.PORT ?? 3001);

await registerAuthPlugin(app);
await registerAuthMiddleware(app);
await registerHealthcheckRoutes(app);
await registerAuthRoutes(app);
await registerUsersRoutes(app);

try {
  try {
    await initializeDatabase();
  } catch (error) {
    app.log.error(error, 'Database initialization failed, continuing in degraded mode');
  }

  await app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`Backend running on http://localhost:${PORT}`);
} catch (error) {
  app.log.error(error);
  process.exit(1);
}

process.on('SIGTERM', async () => {
  await closeDatabase();
  await app.close();
});

process.on('SIGINT', async () => {
  await closeDatabase();
  await app.close();
});
