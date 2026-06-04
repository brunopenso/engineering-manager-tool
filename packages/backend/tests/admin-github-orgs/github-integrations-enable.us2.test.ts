import Fastify from 'fastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_ERROR_CODES } from '../../src/auth/types.js';
import { registerGithubIntegrationsRoutes } from '../../src/routes/githubIntegrations.js';
import * as githubIntegrationService from '../../src/services/githubIntegrationService.js';
import {
  GithubIntegrationDuplicateLoginError,
  GithubIntegrationValidationError,
} from '../../src/services/githubIntegrationValidation.js';
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

describe('US2 POST /github-integrations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('enables an organization for administrators', async () => {
    const app = Fastify();
    app.addHook('onRequest', (request, _reply, done) => {
      request.auth = { ...ADMIN_AUTH };
      done();
    });
    await registerGithubIntegrationsRoutes(app);

    const createdAt = new Date('2026-06-04T12:00:00.000Z');
    vi.mocked(githubIntegrationService.enableGithubIntegration).mockResolvedValue({
      id: 'integration-1',
      organizationName: 'acme-corp',
      createdAt,
      updatedAt: createdAt,
    } as never);

    const response = await app.inject({
      method: 'POST',
      url: '/github-integrations',
      payload: { organizationName: 'acme-corp' },
    });

    expect(response.statusCode).toBe(201);
    expect(githubIntegrationService.enableGithubIntegration).toHaveBeenCalledWith('acme-corp');
    expect(response.json().integration.organizationName).toBe('acme-corp');
    await app.close();
  });

  it('passes trimmed organization name to the service', async () => {
    const app = Fastify();
    app.addHook('onRequest', (request, _reply, done) => {
      request.auth = { ...ADMIN_AUTH };
      done();
    });
    await registerGithubIntegrationsRoutes(app);

    const createdAt = new Date('2026-06-04T12:00:00.000Z');
    vi.mocked(githubIntegrationService.enableGithubIntegration).mockResolvedValue({
      id: 'integration-1',
      organizationName: 'acme-corp',
      createdAt,
      updatedAt: createdAt,
    } as never);

    await app.inject({
      method: 'POST',
      url: '/github-integrations',
      payload: { organizationName: '  acme-corp  ' },
    });

    expect(githubIntegrationService.enableGithubIntegration).toHaveBeenCalledWith('  acme-corp  ');
    await app.close();
  });

  it('returns 409 for duplicate organization name', async () => {
    const app = Fastify();
    app.addHook('onRequest', (request, _reply, done) => {
      request.auth = { ...ADMIN_AUTH };
      done();
    });
    await registerGithubIntegrationsRoutes(app);

    vi.mocked(githubIntegrationService.enableGithubIntegration).mockRejectedValue(
      new GithubIntegrationDuplicateLoginError('This GitHub organization is already enabled.'),
    );

    const response = await app.inject({
      method: 'POST',
      url: '/github-integrations',
      payload: { organizationName: 'acme-corp' },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json().code).toBe(AUTH_ERROR_CODES.DUPLICATE_GITHUB_INTEGRATION_LOGIN);
    await app.close();
  });

  it('returns 400 for invalid organization name', async () => {
    const app = Fastify();
    app.addHook('onRequest', (request, _reply, done) => {
      request.auth = { ...ADMIN_AUTH };
      done();
    });
    await registerGithubIntegrationsRoutes(app);

    vi.mocked(githubIntegrationService.enableGithubIntegration).mockRejectedValue(
      new GithubIntegrationValidationError('Organization name is required.'),
    );

    const response = await app.inject({
      method: 'POST',
      url: '/github-integrations',
      payload: { organizationName: '' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().code).toBe(AUTH_ERROR_CODES.VALIDATION_ERROR);
    await app.close();
  });

  it('returns 400 when organizationName is missing from body', async () => {
    const app = Fastify();
    app.addHook('onRequest', (request, _reply, done) => {
      request.auth = { ...ADMIN_AUTH };
      done();
    });
    await registerGithubIntegrationsRoutes(app);

    const response = await app.inject({
      method: 'POST',
      url: '/github-integrations',
      payload: {},
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().code).toBe(AUTH_ERROR_CODES.VALIDATION_ERROR);
    await app.close();
  });
});
