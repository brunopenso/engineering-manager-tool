import { describe, expect, it, vi } from 'vitest';
import type { GithubApiClient } from '../../src/services/githubApiClient.js';
import {
  runGithubPrImport,
  type GithubPrImportDeps,
} from '../../src/services/githubPrImportService.js';
import { mapImportedPullRequest } from '../../src/services/githubPrQueryService.js';
import type { GithubImportedPullRequest } from '../../src/database/entities/GithubImportedPullRequest.js';
import { samplePullRequestDetails } from '../018-github-pr-import/github-pr-import.setup.js';

describe('US4 nested attach', () => {
  it('passes comments and reviews with the natural-keyed PR upsert', async () => {
    const upsertPullRequestBundle = vi.fn().mockResolvedValue(undefined);
    const comments = [
      {
        githubCommentId: 'c1',
        authorGithubLogin: 'bob',
        body: 'note',
        createdAt: new Date('2026-08-09T16:00:00.000Z'),
        updatedAt: new Date('2026-08-09T16:00:00.000Z'),
        url: null,
      },
    ];
    const reviews = [
      {
        githubReviewId: 'r1',
        reviewerGithubLogin: 'carol',
        body: null,
        state: 'APPROVED',
        createdAt: new Date('2026-08-09T17:00:00.000Z'),
        updatedAt: null,
        url: null,
      },
    ];
    const apiClient: GithubApiClient = {
      searchMergedPullRequests: vi.fn().mockResolvedValue([
        {
          organization: 'acme',
          repository: 'widgets',
          repositoryId: '500',
          number: 42,
          githubPullRequestId: '1001',
        },
      ]),
      getPullRequest: vi.fn().mockResolvedValue(samplePullRequestDetails()),
      listIssueComments: vi.fn().mockResolvedValue(comments),
      listReviews: vi.fn().mockResolvedValue(reviews),
    };
    const deps: GithubPrImportDeps = {
      apiClient,
      listUsersWithGithubLogin: async () => [{ id: 'u1', githubLogin: 'alice-dev' }],
      listEnabledOrganizations: async () => ['acme'],
      upsertControl: vi.fn().mockResolvedValue({}),
      upsertPullRequestBundle,
    };

    await runGithubPrImport({ startDate: '2026-08-09', endDate: '2026-08-09' }, deps);

    expect(upsertPullRequestBundle).toHaveBeenCalledWith(
      expect.objectContaining({ repositoryId: '500', githubPullRequestId: '1001' }),
      comments,
      reviews,
    );
  });

  it('maps nested comments and reviews without collaborator ownership', () => {
    const dto = mapImportedPullRequest({
      id: 'pr-1',
      githubPullRequestId: '1001',
      organization: 'acme',
      repository: 'widgets',
      repositoryId: '500',
      title: 'Fix',
      body: null,
      number: 1,
      changedFilesCount: 1,
      additionsCount: 1,
      deletionsCount: 0,
      sourceBranch: 'a',
      targetBranch: 'b',
      authorGithubLogin: 'alice',
      mergedAt: new Date('2026-08-09T12:00:00.000Z'),
      url: null,
      comments: [
        {
          id: 'c1',
          githubCommentId: '10',
          authorGithubLogin: 'bob',
          body: 'hi',
          createdAtGithub: new Date('2026-08-09T13:00:00.000Z'),
          updatedAtGithub: new Date('2026-08-09T13:00:00.000Z'),
          url: null,
        },
      ],
      reviews: [
        {
          id: 'r1',
          githubReviewId: '20',
          reviewerGithubLogin: 'carol',
          body: null,
          state: 'COMMENTED',
          createdAtGithub: new Date('2026-08-09T14:00:00.000Z'),
          updatedAtGithub: null,
          url: null,
        },
      ],
    } as unknown as GithubImportedPullRequest);

    expect(dto.repositoryId).toBe('500');
    expect(dto.githubPullRequestId).toBe('1001');
    expect(dto.comments).toHaveLength(1);
    expect(dto.reviews[0].state).toBe('COMMENTED');
  });
});
