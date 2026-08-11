import { beforeEach, describe, expect, it, vi } from 'vitest';
import Fastify from 'fastify';
import { AUTH_ERROR_CODES } from '../../src/auth/types.js';
import { AppDataSource } from '../../src/database/connection.js';
import { registerGithubPullRequestsRoutes } from '../../src/routes/githubPullRequests.js';
import { assignImportClassificationFields } from '../../src/services/githubPrImportService.js';
import {
  listClassificationTypes,
  reclassifyPullRequests,
  validateReclassifyPullRequestsInput,
} from '../../src/services/githubPrReclassifyService.js';
import { GithubPrQueryValidationError } from '../../src/services/githubPrQueryService.js';
import { SELF_AUTH } from '../018-github-pr-import/github-pr-import.setup.js';

vi.mock('../../src/services/githubPrReclassifyService.js', async () => {
  const actual =
    await vi.importActual<typeof import('../../src/services/githubPrReclassifyService.js')>(
      '../../src/services/githubPrReclassifyService.js',
    );
  return {
    ...actual,
    reclassifyPullRequests: vi.fn(),
  };
});

const reclassifyPullRequestsMock = vi.mocked(reclassifyPullRequests);

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

describe('assignImportClassificationFields', () => {
  it('sets userReclassification when null', () => {
    const pr = {
      classificationType: null as 'feature' | null,
      userReclassification: null as 'fix' | null,
      complexityIndex: null as number | null,
    };
    assignImportClassificationFields(pr, {
      classificationType: 'feature',
      complexityIndex: 3,
    });
    expect(pr.classificationType).toBe('feature');
    expect(pr.userReclassification).toBe('feature');
    expect(pr.complexityIndex).toBe(3);
  });

  it('preserves existing userReclassification on re-import', () => {
    const pr = {
      classificationType: 'feature' as const,
      userReclassification: 'documentation' as const,
      complexityIndex: 2,
    };
    assignImportClassificationFields(pr, {
      classificationType: 'fix',
      complexityIndex: 4,
    });
    expect(pr.classificationType).toBe('fix');
    expect(pr.userReclassification).toBe('documentation');
    expect(pr.complexityIndex).toBe(4);
  });
});

describe('validateReclassifyPullRequestsInput', () => {
  const validId = '11111111-1111-4111-8111-111111111111';

  it('accepts valid payload and dedupes ids', () => {
    expect(
      validateReclassifyPullRequestsInput({
        pullRequestIds: [validId, validId],
        classification: 'maintenance',
      }),
    ).toEqual({
      pullRequestIds: [validId],
      classification: 'maintenance',
    });
  });

  it('rejects empty ids and invalid classification', () => {
    expect(() =>
      validateReclassifyPullRequestsInput({ pullRequestIds: [], classification: 'feature' }),
    ).toThrow(GithubPrQueryValidationError);
    expect(() =>
      validateReclassifyPullRequestsInput({
        pullRequestIds: [validId],
        classification: 'unknown',
      }),
    ).toThrow(GithubPrQueryValidationError);
    expect(() =>
      validateReclassifyPullRequestsInput({
        pullRequestIds: ['not-a-uuid'],
        classification: 'feature',
      }),
    ).toThrow(GithubPrQueryValidationError);
  });
});

describe('listClassificationTypes', () => {
  it('returns the fixed classification allowlist', () => {
    expect(listClassificationTypes()).toEqual([
      'feature',
      'fix',
      'documentation',
      'maintenance',
    ]);
  });
});

describe('reclassify API routes', () => {
  beforeEach(() => {
    reclassifyPullRequestsMock.mockReset();
  });

  it('GET classification-types requires auth and returns types', async () => {
    const unauth = await buildApp(null);
    const denied = await unauth.inject({
      method: 'GET',
      url: '/github-pull-requests/classification-types',
    });
    expect(denied.statusCode).toBe(401);
    await unauth.close();

    const app = await buildApp(SELF_AUTH);
    const response = await app.inject({
      method: 'GET',
      url: '/github-pull-requests/classification-types',
    });
    expect(response.statusCode).toBe(200);
    expect(response.json().types).toEqual([
      'feature',
      'fix',
      'documentation',
      'maintenance',
    ]);
    await app.close();
  });

  it('PATCH reclassify validates body and delegates to service', async () => {
    const validId = '22222222-2222-4222-8222-222222222222';
    reclassifyPullRequestsMock.mockResolvedValue({
      updatedCount: 1,
      pullRequests: [],
    });

    const app = await buildApp(SELF_AUTH);
    const invalid = await app.inject({
      method: 'PATCH',
      url: '/github-pull-requests/reclassify',
      payload: { pullRequestIds: [], classification: 'feature' },
    });
    expect(invalid.statusCode).toBe(400);
    expect(invalid.json().code).toBe(AUTH_ERROR_CODES.VALIDATION_ERROR);

    const ok = await app.inject({
      method: 'PATCH',
      url: '/github-pull-requests/reclassify',
      payload: { pullRequestIds: [validId], classification: 'documentation' },
    });
    expect(ok.statusCode).toBe(200);
    expect(reclassifyPullRequestsMock).toHaveBeenCalledWith(SELF_AUTH.userId, {
      pullRequestIds: [validId],
      classification: 'documentation',
    });
    await app.close();
  });
});

describe('reclassifyPullRequests service involvement', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects when actor is not involved in a PR', async () => {
    const actual =
      await vi.importActual<typeof import('../../src/services/githubPrReclassifyService.js')>(
        '../../src/services/githubPrReclassifyService.js',
      );

    vi.spyOn(AppDataSource, 'getRepository').mockImplementation((entity) => {
      const name = typeof entity === 'function' ? entity.name : String(entity);
      if (name === 'User') {
        return {
          findOne: vi.fn().mockResolvedValue({ id: 'u1', githubLogin: 'alice-dev' }),
        } as never;
      }
      return {
        createQueryBuilder: vi.fn(() => ({
          leftJoinAndSelect: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          getMany: vi.fn().mockResolvedValue([
            {
              id: '11111111-1111-4111-8111-111111111111',
              authorGithubLogin: 'bob',
              comments: [],
              reviews: [],
              classificationType: 'feature',
              userReclassification: 'feature',
              complexityIndex: 1,
              githubPullRequestId: '1',
              organization: 'acme',
              repository: 'widgets',
              repositoryId: '1',
              title: 'x',
              body: null,
              number: 1,
              changedFilesCount: 1,
              additionsCount: 1,
              deletionsCount: 0,
              sourceBranch: 'a',
              targetBranch: 'main',
              mergedAt: new Date('2026-08-01T00:00:00.000Z'),
              url: null,
            },
          ]),
        })),
        save: vi.fn(),
      } as never;
    });

    await expect(
      actual.reclassifyPullRequests('u1', {
        pullRequestIds: ['11111111-1111-4111-8111-111111111111'],
        classification: 'fix',
      }),
    ).rejects.toMatchObject({ code: AUTH_ERROR_CODES.FORBIDDEN });
  });
});
