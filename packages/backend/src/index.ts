import 'reflect-metadata';
import dotenv from 'dotenv';
import Fastify from 'fastify';
import { initializeDatabase, closeDatabase } from './database/connection.js';
import { registerHealthcheckRoutes } from './routes/healthcheck.js';

dotenv.config();

const app = Fastify({ logger: true });
const PORT = Number(process.env.PORT ?? 3001);

await registerHealthcheckRoutes(app);

try {
  await initializeDatabase();
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
