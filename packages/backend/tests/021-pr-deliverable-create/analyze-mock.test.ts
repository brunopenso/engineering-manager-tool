import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppDataSource } from '../../src/database/connection.js';
import {
  analyzeDeliverableFromPullRequests,
  buildMockDeliverableProposal,
  DeliverableFromPrsForbiddenError,
} from '../../src/services/deliverableFromPrsService.js';
import type { GithubImportedPullRequest } from '../../src/database/entities/GithubImportedPullRequest.js';

const OWNED_ID = '11111111-1111-4111-8111-111111111111';
const FOREIGN_ID = '22222222-2222-4222-8222-222222222222';

function samplePr(
  overrides: Partial<GithubImportedPullRequest> & Pick<GithubImportedPullRequest, 'id'>,
): GithubImportedPullRequest {
  return {
    githubPullRequestId: '1001',
    organization: 'acme',
    repository: 'widgets',
    repositoryId: '500',
    title: 'Fix widgets',
    body: 'Details about the fix',
    number: 42,
    changedFilesCount: 2,
    additionsCount: 10,
    deletionsCount: 1,
    sourceBranch: 'feature/fix',
    targetBranch: 'main',
    authorGithubLogin: 'alice-dev',
    mergedAt: new Date('2026-08-01T12:00:00.000Z'),
    url: 'https://github.com/acme/widgets/pull/42',
    classificationType: 'fix',
    userReclassification: 'fix',
    complexityIndex: 2,
    comments: [],
    reviews: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as GithubImportedPullRequest;
}

describe('021 mock proposal builder', () => {
  it('builds a create-valid proposal from PR metadata', () => {
    const proposal = buildMockDeliverableProposal(
      [samplePr({ id: OWNED_ID }), samplePr({ id: FOREIGN_ID, title: 'Second', number: 43 })],
      'alice-dev',
    );
    expect(proposal.title).toContain('Fix widgets');
    expect(proposal.title).toContain('+1 more');
    expect(proposal.businessImpact).toBe('MEDIUM');
    expect(proposal.roleInDeliverable).toBe('Author');
    expect(proposal.systemTagIds).toEqual([]);
    expect(proposal.links?.[0]?.url).toContain('github.com');
    expect(proposal.improvementPoints.length).toBeGreaterThan(0);
  });
});

describe('021 analyzeDeliverableFromPullRequests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns proposal for authored PR without writing deliverables', async () => {
    const findOne = vi.fn().mockResolvedValue({ id: 'u1', githubLogin: 'alice-dev' });
    const find = vi.fn().mockResolvedValue([samplePr({ id: OWNED_ID })]);
    vi.spyOn(AppDataSource, 'getRepository').mockImplementation((entity) => {
      const name = typeof entity === 'function' ? entity.name : String(entity);
      if (name === 'User') {
        return { findOne } as never;
      }
      return { find } as never;
    });

    const result = await analyzeDeliverableFromPullRequests('u1', {
      pullRequestIds: [OWNED_ID],
    });

    expect(result.sourcePullRequestIds).toEqual([OWNED_ID]);
    expect(result.proposal.title).toBe('Fix widgets');
    expect(result.proposal.roleInDeliverable).toBe('Author');
    expect(find).toHaveBeenCalled();
  });

  it('allows involved-via-review PR', async () => {
    const findOne = vi.fn().mockResolvedValue({ id: 'u1', githubLogin: 'alice-dev' });
    const find = vi.fn().mockResolvedValue([
      samplePr({
        id: OWNED_ID,
        authorGithubLogin: 'bob',
        reviews: [
          {
            id: 'r1',
            githubReviewId: '1',
            reviewerGithubLogin: 'alice-dev',
            body: null,
            state: 'APPROVED',
            createdAt: new Date(),
            updatedAt: null,
            url: null,
          },
        ] as never,
      }),
    ]);
    vi.spyOn(AppDataSource, 'getRepository').mockImplementation((entity) => {
      const name = typeof entity === 'function' ? entity.name : String(entity);
      if (name === 'User') {
        return { findOne } as never;
      }
      return { find } as never;
    });

    const result = await analyzeDeliverableFromPullRequests('u1', {
      pullRequestIds: [OWNED_ID],
    });
    expect(result.proposal.roleInDeliverable).toBe('Contributor');
  });

  it('forbids foreign unauthorized PR', async () => {
    const findOne = vi.fn().mockResolvedValue({ id: 'u1', githubLogin: 'alice-dev' });
    const find = vi.fn().mockResolvedValue([
      samplePr({
        id: FOREIGN_ID,
        authorGithubLogin: 'bob',
        comments: [],
        reviews: [],
      }),
    ]);
    vi.spyOn(AppDataSource, 'getRepository').mockImplementation((entity) => {
      const name = typeof entity === 'function' ? entity.name : String(entity);
      if (name === 'User') {
        return { findOne } as never;
      }
      return { find } as never;
    });

    await expect(
      analyzeDeliverableFromPullRequests('u1', { pullRequestIds: [FOREIGN_ID] }),
    ).rejects.toBeInstanceOf(DeliverableFromPrsForbiddenError);
  });

  it('forbids missing PR ids', async () => {
    const findOne = vi.fn().mockResolvedValue({ id: 'u1', githubLogin: 'alice-dev' });
    const find = vi.fn().mockResolvedValue([]);
    vi.spyOn(AppDataSource, 'getRepository').mockImplementation((entity) => {
      const name = typeof entity === 'function' ? entity.name : String(entity);
      if (name === 'User') {
        return { findOne } as never;
      }
      return { find } as never;
    });

    await expect(
      analyzeDeliverableFromPullRequests('u1', { pullRequestIds: [OWNED_ID] }),
    ).rejects.toBeInstanceOf(DeliverableFromPrsForbiddenError);
  });
});
