import Fastify from 'fastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_ERROR_CODES } from '../../src/auth/types.js';
import { registerGithubPullRequestsRoutes } from '../../src/routes/githubPullRequests.js';
import * as queryService from '../../src/services/githubPrQueryService.js';
import { SELF_AUTH } from '../018-github-pr-import/github-pr-import.setup.js';

vi.mock('../../src/services/githubPrQueryService.js', async () => {
  const actual = await vi.importActual<typeof import('../../src/services/githubPrQueryService.js')>(
    '../../src/services/githubPrQueryService.js',
  );
  return {
    ...actual,
    queryMyPullRequestActivity: vi.fn(),
  };
});

const queryMyPullRequestActivity = vi.mocked(queryService.queryMyPullRequestActivity);

async function buildApp(auth: typeof SELF_AUTH | null) {
  const app = Fastify();
  if (auth) {
    app.addHook('onRequest', (request, _reply, done) => {
      request.auth = { ...auth };
      done();
    });
  }
  await registerGithubPullRequestsRoutes(app);
  return app;
}

describe('020 my-activity validation and auth', () => {
  beforeEach(() => {
    queryMyPullRequestActivity.mockReset();
  });

  it('returns 401 when unauthenticated', async () => {
    const app = await buildApp(null);
    const response = await app.inject({
      method: 'POST',
      url: '/github-pull-requests/my-activity',
      payload: { startDate: '2026-06-13', endDate: '2026-08-11' },
    });
    expect(response.statusCode).toBe(401);
    expect(response.json().code).toBe(AUTH_ERROR_CODES.MISSING_APP_TOKEN);
    expect(queryMyPullRequestActivity).not.toHaveBeenCalled();
    await app.close();
  });

  it('rejects inverted and invalid dates with 400', async () => {
    const app = await buildApp(SELF_AUTH);
    const inverted = await app.inject({
      method: 'POST',
      url: '/github-pull-requests/my-activity',
      payload: { startDate: '2026-08-11', endDate: '2026-06-13' },
    });
    expect(inverted.statusCode).toBe(400);
    expect(inverted.json().code).toBe(AUTH_ERROR_CODES.VALIDATION_ERROR);

    const bad = await app.inject({
      method: 'POST',
      url: '/github-pull-requests/my-activity',
      payload: { startDate: 'not-a-date', endDate: '2026-08-11' },
    });
    expect(bad.statusCode).toBe(400);
    await app.close();
  });

  it('returns empty list when service resolves empty (no github login)', async () => {
    queryMyPullRequestActivity.mockResolvedValue([]);
    const app = await buildApp(SELF_AUTH);
    const response = await app.inject({
      method: 'POST',
      url: '/github-pull-requests/my-activity',
      payload: { startDate: '2026-06-13', endDate: '2026-08-11' },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json().pullRequests).toEqual([]);
    expect(queryMyPullRequestActivity).toHaveBeenCalledWith(SELF_AUTH.userId, {
      startDate: '2026-06-13',
      endDate: '2026-08-11',
    });
    await app.close();
  });
});
