import Fastify from 'fastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_ERROR_CODES } from '../../src/auth/types.js';
import { registerGithubPullRequestsRoutes } from '../../src/routes/githubPullRequests.js';
import * as queryService from '../../src/services/githubPrQueryService.js';
import { ADMIN_AUTH, LEADER_AUTH, SELF_AUTH } from './github-pr-import.setup.js';

vi.mock('../../src/services/githubPrQueryService.js', async () => {
  const actual = await vi.importActual<typeof import('../../src/services/githubPrQueryService.js')>(
    '../../src/services/githubPrQueryService.js',
  );
  return {
    ...actual,
    queryImportedPullRequests: vi.fn(),
  };
});

const queryImportedPullRequests = vi.mocked(queryService.queryImportedPullRequests);

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

describe('US3 query filters and validation', () => {
  beforeEach(() => {
    queryImportedPullRequests.mockReset();
  });

  it('returns pull requests for valid query', async () => {
    queryImportedPullRequests.mockResolvedValue([
      {
        id: 'pr-1',
        githubPullRequestId: '1001',
        organization: 'acme',
        repository: 'widgets',
        repositoryId: '500',
        title: 'Fix',
        body: null,
        number: 42,
        changedFilesCount: 1,
        additionsCount: 1,
        deletionsCount: 0,
        sourceBranch: 'a',
        targetBranch: 'main',
        authorGithubLogin: 'alice-dev',
        mergedAt: '2026-08-09T15:00:00.000Z',
        url: null,
        comments: [],
        reviews: [],
      },
    ]);
    const app = await buildApp(SELF_AUTH);
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
    expect(response.json().pullRequests).toHaveLength(1);
    await app.close();
  });

  it('rejects empty githubLogins and inverted dates', async () => {
    const app = await buildApp(SELF_AUTH);
    const empty = await app.inject({
      method: 'POST',
      url: '/github-pull-requests/query',
      payload: { githubLogins: [], startDate: '2026-08-09', endDate: '2026-08-09' },
    });
    expect(empty.statusCode).toBe(400);
    expect(empty.json().code).toBe(AUTH_ERROR_CODES.VALIDATION_ERROR);

    const inverted = await app.inject({
      method: 'POST',
      url: '/github-pull-requests/query',
      payload: {
        githubLogins: ['alice-dev'],
        startDate: '2026-08-10',
        endDate: '2026-08-09',
      },
    });
    expect(inverted.statusCode).toBe(400);
    await app.close();
  });

  it('returns empty list when nothing matches', async () => {
    queryImportedPullRequests.mockResolvedValue([]);
    const app = await buildApp(SELF_AUTH);
    const response = await app.inject({
      method: 'POST',
      url: '/github-pull-requests/query',
      payload: {
        githubLogins: ['unknown'],
        startDate: '2026-08-09',
        endDate: '2026-08-09',
      },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json().pullRequests).toEqual([]);
    await app.close();
  });
});

describe('US3 DAC and auth', () => {
  beforeEach(() => {
    queryImportedPullRequests.mockReset();
  });

  it('returns 401 when unauthenticated', async () => {
    const app = await buildApp(null);
    const response = await app.inject({
      method: 'POST',
      url: '/github-pull-requests/query',
      payload: {
        githubLogins: ['alice-dev'],
        startDate: '2026-08-09',
        endDate: '2026-08-09',
      },
    });
    expect(response.statusCode).toBe(401);
    await app.close();
  });

  it('returns 403 when query service denies peer/superior access', async () => {
    queryImportedPullRequests.mockRejectedValue(
      Object.assign(new Error('denied'), { name: AUTH_ERROR_CODES.FORBIDDEN }),
    );
    const app = await buildApp(SELF_AUTH);
    const response = await app.inject({
      method: 'POST',
      url: '/github-pull-requests/query',
      payload: {
        githubLogins: ['peer-dev'],
        startDate: '2026-08-09',
        endDate: '2026-08-09',
      },
    });
    expect(response.statusCode).toBe(403);
    expect(response.json().code).toBe(AUTH_ERROR_CODES.FORBIDDEN);
    await app.close();
  });

  it('allows leader and admin callers when service resolves', async () => {
    queryImportedPullRequests.mockResolvedValue([]);
    const leaderApp = await buildApp(LEADER_AUTH);
    const leaderResponse = await leaderApp.inject({
      method: 'POST',
      url: '/github-pull-requests/query',
      payload: {
        githubLogins: ['alice-dev'],
        startDate: '2026-08-09',
        endDate: '2026-08-09',
      },
    });
    expect(leaderResponse.statusCode).toBe(200);
    await leaderApp.close();

    const adminApp = await buildApp(ADMIN_AUTH);
    const adminResponse = await adminApp.inject({
      method: 'POST',
      url: '/github-pull-requests/query',
      payload: {
        githubLogins: ['alice-dev'],
        startDate: '2026-08-09',
        endDate: '2026-08-09',
      },
    });
    expect(adminResponse.statusCode).toBe(200);
    await adminApp.close();
  });
});

describe('US3 nested payload mapping', () => {
  it('includes nested comments and reviews in response', async () => {
    queryImportedPullRequests.mockResolvedValue([
      {
        id: 'pr-1',
        githubPullRequestId: '1001',
        organization: 'acme',
        repository: 'widgets',
        repositoryId: '500',
        title: 'Fix',
        body: 'body',
        number: 42,
        changedFilesCount: 1,
        additionsCount: 1,
        deletionsCount: 0,
        sourceBranch: 'a',
        targetBranch: 'main',
        authorGithubLogin: 'alice-dev',
        mergedAt: '2026-08-09T15:00:00.000Z',
        url: 'https://example.com/pr/42',
        comments: [
          {
            id: 'c-1',
            githubCommentId: 'c1',
            authorGithubLogin: 'bob',
            body: 'nice',
            createdAt: '2026-08-09T16:00:00.000Z',
            updatedAt: '2026-08-09T16:00:00.000Z',
            url: null,
          },
        ],
        reviews: [
          {
            id: 'r-1',
            githubReviewId: 'r1',
            reviewerGithubLogin: 'carol',
            body: 'LGTM',
            state: 'APPROVED',
            createdAt: '2026-08-09T16:30:00.000Z',
            updatedAt: null,
            url: null,
          },
        ],
      },
    ]);
    const app = await buildApp(SELF_AUTH);
    const response = await app.inject({
      method: 'POST',
      url: '/github-pull-requests/query',
      payload: {
        githubLogins: ['alice-dev'],
        startDate: '2026-08-09',
        endDate: '2026-08-09',
      },
    });
    const body = response.json();
    expect(body.pullRequests[0].comments[0].body).toBe('nice');
    expect(body.pullRequests[0].reviews[0].state).toBe('APPROVED');
    await app.close();
  });
});
