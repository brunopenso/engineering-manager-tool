import { describe, expect, it, vi } from 'vitest';
import Fastify from 'fastify';
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

describe('query endpoint is read-only for collection control', () => {
  it('does not expose mutation of collection controls via query route', async () => {
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
        startDate: '2026-08-09',
        endDate: '2026-08-09',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(vi.mocked(queryService.queryImportedPullRequests)).toHaveBeenCalled();
    // Route registration only includes query; no collection-control write endpoints.
    const routes = app.printRoutes();
    expect(routes).toContain('github-pull-requests/query');
    expect(routes).not.toContain('collection-control');
    await app.close();
  });
});
