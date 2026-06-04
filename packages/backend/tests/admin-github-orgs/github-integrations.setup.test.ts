import Fastify from 'fastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerGithubIntegrationsRoutes } from '../../src/routes/githubIntegrations.js';
import * as githubIntegrationService from '../../src/services/githubIntegrationService.js';
import { ADMIN_AUTH } from './github-integrations.setup.js';

vi.mock('../../src/services/githubIntegrationService.js', () => ({
  listGithubIntegrations: vi.fn(),
  enableGithubIntegration: vi.fn(),
  disableGithubIntegration: vi.fn(),
  mapGithubIntegration: vi.fn(),
}));

describe('github integrations setup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty integrations for administrators', async () => {
    const app = Fastify();
    app.addHook('onRequest', (request, _reply, done) => {
      request.auth = { ...ADMIN_AUTH };
      done();
    });
    await registerGithubIntegrationsRoutes(app);

    vi.mocked(githubIntegrationService.listGithubIntegrations).mockResolvedValue([]);

    const response = await app.inject({ method: 'GET', url: '/github-integrations' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ integrations: [] });
    await app.close();
  });
});
