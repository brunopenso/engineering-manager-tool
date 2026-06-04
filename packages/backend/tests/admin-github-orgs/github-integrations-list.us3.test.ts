import Fastify from 'fastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerGithubIntegrationsRoutes } from '../../src/routes/githubIntegrations.js';
import * as githubIntegrationService from '../../src/services/githubIntegrationService.js';
import { ADMIN_AUTH } from './github-integrations.setup.js';

vi.mock('../../src/services/githubIntegrationService.js', () => ({
  listGithubIntegrations: vi.fn(),
  enableGithubIntegration: vi.fn(),
  disableGithubIntegration: vi.fn(),
  mapGithubIntegration: vi.fn((entity: { id: string; organizationName: string; createdAt: Date; updatedAt: Date }) => ({
    id: entity.id,
    organizationName: entity.organizationName,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  })),
}));

describe('US3 GET /github-integrations list', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns integrations with stable ids', async () => {
    const app = Fastify();
    app.addHook('onRequest', (request, _reply, done) => {
      request.auth = { ...ADMIN_AUTH };
      done();
    });
    await registerGithubIntegrationsRoutes(app);

    const createdAt = new Date('2026-06-04T12:00:00.000Z');
    vi.mocked(githubIntegrationService.listGithubIntegrations).mockResolvedValue([
      {
        id: 'integration-1',
        organizationName: 'acme-corp',
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: 'integration-2',
        organizationName: 'beta-org',
        createdAt,
        updatedAt: createdAt,
      },
    ] as never);

    const response = await app.inject({ method: 'GET', url: '/github-integrations' });
    const payload = response.json();

    expect(response.statusCode).toBe(200);
    expect(payload.integrations).toHaveLength(2);
    expect(payload.integrations[0].id).toBe('integration-1');
    expect(payload.integrations[1].organizationName).toBe('beta-org');
    await app.close();
  });
});
