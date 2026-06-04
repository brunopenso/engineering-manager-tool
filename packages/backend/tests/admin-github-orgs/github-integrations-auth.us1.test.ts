import Fastify from 'fastify';
import { describe, expect, it, vi } from 'vitest';
import { AUTH_ERROR_CODES } from '../../src/auth/types.js';
import { registerGithubIntegrationsRoutes } from '../../src/routes/githubIntegrations.js';
import { COLLABORATOR_AUTH } from './github-integrations.setup.js';

vi.mock('../../src/services/githubIntegrationService.js', () => ({
  listGithubIntegrations: vi.fn(),
  enableGithubIntegration: vi.fn(),
  disableGithubIntegration: vi.fn(),
  mapGithubIntegration: vi.fn(),
}));

describe('US1 non-admin GET /github-integrations', () => {
  it('returns forbidden for collaborator-only users', async () => {
    const app = Fastify();
    app.addHook('onRequest', (request, _reply, done) => {
      request.auth = { ...COLLABORATOR_AUTH };
      done();
    });
    await registerGithubIntegrationsRoutes(app);

    const response = await app.inject({ method: 'GET', url: '/github-integrations' });

    expect(response.statusCode).toBe(403);
    expect(response.json().code).toBe(AUTH_ERROR_CODES.FORBIDDEN);
    await app.close();
  });
});
