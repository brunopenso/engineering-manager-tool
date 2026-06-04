import Fastify from 'fastify';
import { describe, expect, it, vi } from 'vitest';
import { AUTH_ERROR_CODES } from '../../src/auth/types.js';
import { registerGithubIntegrationsRoutes } from '../../src/routes/githubIntegrations.js';

vi.mock('../../src/services/githubIntegrationService.js', () => ({
  listGithubIntegrations: vi.fn(),
  enableGithubIntegration: vi.fn(),
  disableGithubIntegration: vi.fn(),
  mapGithubIntegration: vi.fn(),
}));

describe('github integrations auth', () => {
  it('returns 401 for unauthenticated GET', async () => {
    const app = Fastify();
    await registerGithubIntegrationsRoutes(app);

    const response = await app.inject({ method: 'GET', url: '/github-integrations' });

    expect(response.statusCode).toBe(401);
    expect(response.json().code).toBe(AUTH_ERROR_CODES.MISSING_APP_TOKEN);
    await app.close();
  });

  it('returns 401 for unauthenticated POST', async () => {
    const app = Fastify();
    await registerGithubIntegrationsRoutes(app);

    const response = await app.inject({
      method: 'POST',
      url: '/github-integrations',
      payload: { login: 'acme-corp' },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().code).toBe(AUTH_ERROR_CODES.MISSING_APP_TOKEN);
    await app.close();
  });

  it('returns 401 for unauthenticated DELETE', async () => {
    const app = Fastify();
    await registerGithubIntegrationsRoutes(app);

    const response = await app.inject({
      method: 'DELETE',
      url: '/github-integrations/integration-1',
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().code).toBe(AUTH_ERROR_CODES.MISSING_APP_TOKEN);
    await app.close();
  });
});
