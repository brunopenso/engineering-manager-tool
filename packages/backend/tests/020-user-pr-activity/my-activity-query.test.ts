import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppDataSource } from '../../src/database/connection.js';
import {
  deriveInvolvementRole,
  isActorInvolvedInPullRequest,
  queryMyPullRequestActivity,
  type ImportedPullRequestDto,
} from '../../src/services/githubPrQueryService.js';

function baseDto(
  overrides: Partial<ImportedPullRequestDto> & Pick<ImportedPullRequestDto, 'authorGithubLogin'>,
): ImportedPullRequestDto {
  return {
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
    mergedAt: '2026-08-09T15:00:00.000Z',
    url: null,
    comments: [],
    reviews: [],
    ...overrides,
  };
}

describe('020 my-activity involvement helpers', () => {
  it('marks author as owner and others as involved', () => {
    expect(deriveInvolvementRole('Alice-Dev', 'alice-dev')).toBe('owner');
    expect(deriveInvolvementRole('bob', 'alice-dev')).toBe('involved');
  });

  it('detects authored, commented, and reviewed involvement', () => {
    expect(
      isActorInvolvedInPullRequest(baseDto({ authorGithubLogin: 'alice-dev' }), 'alice-dev'),
    ).toBe(true);

    expect(
      isActorInvolvedInPullRequest(
        baseDto({
          authorGithubLogin: 'bob',
          comments: [
            {
              id: 'c1',
              githubCommentId: '1',
              authorGithubLogin: 'alice-dev',
              body: 'lgtm',
              createdAt: '2026-08-09T16:00:00.000Z',
              updatedAt: '2026-08-09T16:00:00.000Z',
              url: null,
            },
          ],
        }),
        'alice-dev',
      ),
    ).toBe(true);

    expect(
      isActorInvolvedInPullRequest(
        baseDto({
          authorGithubLogin: 'bob',
          reviews: [
            {
              id: 'r1',
              githubReviewId: '1',
              reviewerGithubLogin: 'alice-dev',
              body: null,
              state: 'APPROVED',
              createdAt: '2026-08-09T16:00:00.000Z',
              updatedAt: null,
              url: null,
            },
          ],
        }),
        'alice-dev',
      ),
    ).toBe(true);

    expect(isActorInvolvedInPullRequest(baseDto({ authorGithubLogin: 'bob' }), 'alice-dev')).toBe(
      false,
    );
  });
});

describe('020 queryMyPullRequestActivity', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns empty when actor has no github login', async () => {
    vi.spyOn(AppDataSource, 'getRepository').mockReturnValue({
      findOne: vi.fn().mockResolvedValue({ id: 'u1', githubLogin: null }),
    } as never);

    const result = await queryMyPullRequestActivity('u1', {
      startDate: '2026-06-13',
      endDate: '2026-08-11',
    });
    expect(result).toEqual([]);
  });

  it('maps owned and involved PRs with roles and excludes unrelated authored PRs from result set logic', async () => {
    const getMany = vi.fn().mockResolvedValue([
      {
        id: 'pr-owned',
        githubPullRequestId: '1',
        organization: 'acme',
        repository: 'widgets',
        repositoryId: '500',
        title: 'Mine',
        body: null,
        number: 1,
        changedFilesCount: 1,
        additionsCount: 1,
        deletionsCount: 0,
        sourceBranch: 'a',
        targetBranch: 'main',
        authorGithubLogin: 'alice-dev',
        mergedAt: new Date('2026-08-01T12:00:00.000Z'),
        url: null,
        comments: [],
        reviews: [],
      },
      {
        id: 'pr-reviewed',
        githubPullRequestId: '2',
        organization: 'acme',
        repository: 'widgets',
        repositoryId: '500',
        title: 'Theirs',
        body: null,
        number: 2,
        changedFilesCount: 1,
        additionsCount: 1,
        deletionsCount: 0,
        sourceBranch: 'b',
        targetBranch: 'main',
        authorGithubLogin: 'bob',
        mergedAt: new Date('2026-08-02T12:00:00.000Z'),
        url: null,
        comments: [],
        reviews: [
          {
            id: 'r1',
            githubReviewId: '10',
            reviewerGithubLogin: 'alice-dev',
            body: null,
            state: 'APPROVED',
            createdAtGithub: new Date('2026-08-02T13:00:00.000Z'),
            updatedAtGithub: null,
            url: null,
          },
        ],
      },
    ]);

    const createQueryBuilder = vi.fn(() => {
      const qb: Record<string, unknown> = {};
      qb.leftJoinAndSelect = vi.fn().mockReturnValue(qb);
      qb.where = vi.fn().mockReturnValue(qb);
      qb.andWhere = vi.fn().mockReturnValue(qb);
      qb.orderBy = vi.fn().mockReturnValue(qb);
      qb.getMany = getMany;
      return qb;
    });

    vi.spyOn(AppDataSource, 'getRepository').mockImplementation((entity) => {
      if (entity && typeof entity === 'function' && entity.name === 'User') {
        return {
          findOne: vi.fn().mockResolvedValue({ id: 'u1', githubLogin: 'alice-dev' }),
        } as never;
      }
      return { createQueryBuilder } as never;
    });

    const result = await queryMyPullRequestActivity('u1', {
      startDate: '2026-06-13',
      endDate: '2026-08-11',
    });

    expect(result).toHaveLength(2);
    expect(result.find((pr) => pr.id === 'pr-owned')?.involvementRole).toBe('owner');
    expect(result.find((pr) => pr.id === 'pr-reviewed')?.involvementRole).toBe('involved');
    expect(result.every((pr) => isActorInvolvedInPullRequest(pr, 'alice-dev'))).toBe(true);
  });
});
