import Fastify from 'fastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_ERROR_CODES } from '../../src/auth/types.js';
import { registerGithubIntegrationsRoutes } from '../../src/routes/githubIntegrations.js';
import * as githubIntegrationService from '../../src/services/githubIntegrationService.js';
import { ADMIN_AUTH } from './github-integrations.setup.js';

vi.mock('../../src/services/githubIntegrationService.js', () => ({
  listGithubIntegrations: vi.fn(),
  enableGithubIntegration: vi.fn(),
  disableGithubIntegration: vi.fn(),
  mapGithubIntegration: vi.fn(),
}));

describe('US3 DELETE /github-integrations/:integrationId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('disables an integration and returns 204', async () => {
    const app = Fastify();
    app.addHook('onRequest', (request, _reply, done) => {
      request.auth = { ...ADMIN_AUTH };
      done();
    });
    await registerGithubIntegrationsRoutes(app);

    vi.mocked(githubIntegrationService.disableGithubIntegration).mockResolvedValue(true);

    const response = await app.inject({
      method: 'DELETE',
      url: '/github-integrations/integration-1',
    });

    expect(response.statusCode).toBe(204);
    expect(githubIntegrationService.disableGithubIntegration).toHaveBeenCalledWith('integration-1');
    await app.close();
  });

  it('returns 404 when integration id is unknown', async () => {
    const app = Fastify();
    app.addHook('onRequest', (request, _reply, done) => {
      request.auth = { ...ADMIN_AUTH };
      done();
    });
    await registerGithubIntegrationsRoutes(app);

    vi.mocked(githubIntegrationService.disableGithubIntegration).mockResolvedValue(false);

    const response = await app.inject({
      method: 'DELETE',
      url: '/github-integrations/missing-id',
    });

    expect(response.statusCode).toBe(404);
    expect(response.json().code).toBe(AUTH_ERROR_CODES.NOT_FOUND);
    await app.close();
  });
});
