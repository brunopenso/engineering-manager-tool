import { describe, expect, it, vi } from 'vitest';
import type { GithubApiClient } from '../../src/services/githubApiClient.js';
import { runGithubPrImport, type GithubPrImportDeps } from '../../src/services/githubPrImportService.js';
import { samplePullRequestDetails } from './github-pr-import.setup.js';

function createMockApi(overrides: Partial<GithubApiClient> = {}): GithubApiClient {
  return {
    searchMergedPullRequests: vi.fn().mockResolvedValue([]),
    getPullRequest: vi.fn(),
    listIssueComments: vi.fn().mockResolvedValue([]),
    listReviews: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

describe('US1 import user and org filters', () => {
  it('skips users without githubLogin and queries only enabled orgs', async () => {
    const apiClient = createMockApi();
    const upsertPullRequestBundle = vi.fn();
    const deps: GithubPrImportDeps = {
      apiClient,
      listUsersWithGithubLogin: async () => [
        { id: 'u1', githubLogin: 'alice-dev' },
        { id: 'u2', githubLogin: null },
      ],
      listEnabledOrganizations: async () => ['acme'],
      findControl: async () => null,
      upsertControl: vi.fn().mockResolvedValue({}),
      upsertPullRequestBundle,
    };

    const summary = await runGithubPrImport(
      { startDate: '2026-08-09', endDate: '2026-08-09' },
      deps,
    );

    expect(apiClient.searchMergedPullRequests).toHaveBeenCalledTimes(1);
    expect(apiClient.searchMergedPullRequests).toHaveBeenCalledWith({
      authorLogin: 'alice-dev',
      organization: 'acme',
      startDate: '2026-08-09',
      endDate: '2026-08-09',
    });
    expect(summary.succeeded).toBe(1);
    expect(upsertPullRequestBundle).not.toHaveBeenCalled();
  });
});

describe('US1 import selection and persistence', () => {
  it('persists matching PRs with comments and reviews and ignores mismatches', async () => {
    const matching = samplePullRequestDetails();
    const wrongAuthor = samplePullRequestDetails({
      githubPullRequestId: '1002',
      number: 43,
      authorGithubLogin: 'other-user',
    });
    const upsertPullRequestBundle = vi.fn().mockResolvedValue(undefined);
    const apiClient = createMockApi({
      searchMergedPullRequests: vi.fn().mockResolvedValue([
        {
          organization: 'acme',
          repository: 'widgets',
          repositoryId: '500',
          number: 42,
          githubPullRequestId: '1001',
        },
        {
          organization: 'acme',
          repository: 'widgets',
          repositoryId: '500',
          number: 43,
          githubPullRequestId: '1002',
        },
      ]),
      getPullRequest: vi
        .fn()
        .mockResolvedValueOnce(matching)
        .mockResolvedValueOnce(wrongAuthor),
      listIssueComments: vi.fn().mockResolvedValue([
        {
          githubCommentId: 'c1',
          authorGithubLogin: 'reviewer',
          body: 'Looks good',
          createdAt: new Date('2026-08-09T16:00:00.000Z'),
          updatedAt: new Date('2026-08-09T16:00:00.000Z'),
          url: 'https://github.com/acme/widgets/pull/42#issuecomment-1',
        },
      ]),
      listReviews: vi.fn().mockResolvedValue([
        {
          githubReviewId: 'r1',
          reviewerGithubLogin: 'reviewer',
          body: 'Approved',
          state: 'APPROVED',
          createdAt: new Date('2026-08-09T16:30:00.000Z'),
          updatedAt: null,
          url: 'https://github.com/acme/widgets/pull/42#pullrequestreview-1',
        },
      ]),
    });

    const deps: GithubPrImportDeps = {
      apiClient,
      listUsersWithGithubLogin: async () => [{ id: 'u1', githubLogin: 'alice-dev' }],
      listEnabledOrganizations: async () => ['acme'],
      findControl: async () => null,
      upsertControl: vi.fn().mockResolvedValue({}),
      upsertPullRequestBundle,
    };

    const summary = await runGithubPrImport(
      { startDate: '2026-08-09', endDate: '2026-08-09' },
      deps,
    );

    expect(summary.pullRequestsImported).toBe(1);
    expect(upsertPullRequestBundle).toHaveBeenCalledTimes(1);
    expect(upsertPullRequestBundle.mock.calls[0][1].githubPullRequestId).toBe('1001');
    expect(upsertPullRequestBundle.mock.calls[0][2]).toHaveLength(1);
    expect(upsertPullRequestBundle.mock.calls[0][3]).toHaveLength(1);
  });
});
