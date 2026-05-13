import type { FastifyInstance } from 'fastify';
import { AppDataSource } from '../database/connection.js';

type HealthCheckResult = {
  status: 'ok' | 'error';
  message?: string;
};

async function runDatabaseCheck(): Promise<HealthCheckResult> {
  if (!AppDataSource.isInitialized) {
    return {
      status: 'error',
      message: 'Database connection is not initialized',
    };
  }

  try {
    await AppDataSource.query('SELECT 1');
    return { status: 'ok' };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown database error',
    };
  }
}

export async function registerHealthcheckRoutes(app: FastifyInstance): Promise<void> {
  app.get('/healthcheck', async () => {
    return { status: 'ok' };
  });

  app.get('/healthcheck/complete', async (_request, reply) => {
    const checks = {
      database: await runDatabaseCheck(),
    };

    const hasFailures = Object.values(checks).some((check) => check.status === 'error');
    const status = hasFailures ? 'degraded' : 'ok';

    if (hasFailures) {
      reply.code(503);
    }

    return { status, checks };
  });
}
