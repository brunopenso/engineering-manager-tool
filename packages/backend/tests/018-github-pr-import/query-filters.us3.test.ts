import { describe, expect, it, vi } from 'vitest';
import Fastify from 'fastify';
import { AUTH_ERROR_CODES } from '../../src/auth/types.js';
import { registerGithubPullRequestsRoutes } from '../../src/routes/githubPullRequests.js';
import * as queryService from '../../src/services/githubPrQueryService.js';
import { SELF_AUTH } from './github-pr-import.setup.js';

vi.mock('../../src/services/githubPrQueryService.js', async () => {
  const actual = await vi.importActual<typeof import('../../src/services/githubPrQueryService.js')>(
    '../../src/services/githubPrQueryService.js',
  );
  return {
    ...actual,
    queryImportedPullRequests: vi.fn().mockResolvedValue([]),
  };
});

describe('US3 query filter contract', () => {
  it('forwards githubLogins and date filter to the query service', async () => {
    const app = Fastify();
    app.addHook('onRequest', (request, _reply, done) => {
      request.auth = { ...SELF_AUTH };
      done();
    });
    await registerGithubPullRequestsRoutes(app);

    const response = await app.inject({
      method: 'POST',
      url: '/github-pull-requests/query',
      payload: {
        githubLogins: ['alice-dev', 'bob-eng'],
        startDate: '2026-08-01',
        endDate: '2026-08-09',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(vi.mocked(queryService.queryImportedPullRequests)).toHaveBeenCalledWith(
      SELF_AUTH.userId,
      SELF_AUTH.roles,
      {
        githubLogins: ['alice-dev', 'bob-eng'],
        startDate: '2026-08-01',
        endDate: '2026-08-09',
      },
    );
    await app.close();
  });

  it('returns validation error code for malformed dates', async () => {
    const app = Fastify();
    app.addHook('onRequest', (request, _reply, done) => {
      request.auth = { ...SELF_AUTH };
      done();
    });
    await registerGithubPullRequestsRoutes(app);

    const response = await app.inject({
      method: 'POST',
      url: '/github-pull-requests/query',
      payload: {
        githubLogins: ['alice-dev'],
        startDate: '08-09-2026',
        endDate: '2026-08-09',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().code).toBe(AUTH_ERROR_CODES.VALIDATION_ERROR);
    await app.close();
  });
});
