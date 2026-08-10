import { describe, expect, it, vi } from 'vitest';
import type { GithubApiClient } from '../../src/services/githubApiClient.js';
import { runGithubPrImport, type GithubPrImportDeps } from '../../src/services/githubPrImportService.js';
import { samplePullRequestDetails } from './github-pr-import.setup.js';

describe('US1 import persist fields', () => {
  it('passes required PR fields through to the persistence adapter', async () => {
    const details = samplePullRequestDetails();
    const upsertPullRequestBundle = vi.fn().mockResolvedValue(undefined);
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
      getPullRequest: vi.fn().mockResolvedValue(details),
      listIssueComments: vi.fn().mockResolvedValue([]),
      listReviews: vi.fn().mockResolvedValue([]),
    };
    const deps: GithubPrImportDeps = {
      apiClient,
      listUsersWithGithubLogin: async () => [{ id: 'u1', githubLogin: 'alice-dev' }],
      listEnabledOrganizations: async () => ['acme'],
      findControl: async () => null,
      upsertControl: vi.fn().mockResolvedValue({}),
      upsertPullRequestBundle,
    };

    await runGithubPrImport({ startDate: '2026-08-09', endDate: '2026-08-09' }, deps);

    expect(upsertPullRequestBundle).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({
        githubPullRequestId: '1001',
        organization: 'acme',
        repository: 'widgets',
        repositoryId: '500',
        title: 'Fix widgets',
        number: 42,
        changedFilesCount: 3,
        additionsCount: 10,
        deletionsCount: 2,
        sourceBranch: 'feature/fix',
        targetBranch: 'main',
        authorGithubLogin: 'alice-dev',
        url: 'https://github.com/acme/widgets/pull/42',
      }),
      [],
      [],
    );
  });
});
